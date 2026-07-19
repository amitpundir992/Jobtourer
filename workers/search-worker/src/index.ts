import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { config } from 'dotenv'
import path from 'node:path'
import { prisma } from '@jobtourer/database'
import type { ParsedResumeData } from '@jobtourer/types'
import { logger } from './lib/logger'
import { searchJobs } from './services/job-search.service'
import { scoreCandidate } from './services/matching.service'

config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '../../.env') })

function redisUrl() {
  return (process.env.REDIS_URL || 'redis://localhost:6379')
    .trim()
    .replace(/^[\\"']+|[\\"']+$/g, '')
}

const connection = new Redis(redisUrl(), { maxRetriesPerRequest: null })
const searchQueue = new Queue('job-search', { connection })
const emailQueue = new Queue('email-generation', { connection })
const MAX_DRAFTS_PER_RUN = 10

interface LocalTime {
  date: string
  hour: number
}

function localTime(date: Date, timezone: string): LocalTime {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number(value('hour')),
  }
}

function automationDue(
  preference: {
    timezone: string
    schedule_hour: number
    last_run_at: Date | null
  },
  now: Date
) {
  const current = localTime(now, preference.timezone)
  const last = preference.last_run_at
    ? localTime(preference.last_run_at, preference.timezone)
    : null
  return (
    current.hour === preference.schedule_hour && current.date !== last?.date
  )
}

async function dispatchAutomation() {
  const now = new Date()
  const preferences = await prisma.automationPreference.findMany({
    where: { enabled: true },
  })
  let queued = 0

  for (const preference of preferences) {
    try {
      if (!automationDue(preference, now)) continue
      const date = localTime(now, preference.timezone).date
      const jobId = `automation-${preference.user_id}-${date}`
      if (await searchQueue.getJob(jobId)) continue

      const [profile, resume] = await Promise.all([
        prisma.profile.findUnique({ where: { user_id: preference.user_id } }),
        prisma.resume.findFirst({
          where: { user_id: preference.user_id, is_default: true },
        }),
      ])
      if (!profile?.preferred_role || !resume?.parsed_data) {
        logger.warn(
          `Skipping automation for ${preference.user_id}: profile or parsed resume missing`
        )
        continue
      }

      const run = await prisma.automationRun.create({
        data: { user_id: preference.user_id, trigger: 'scheduled' },
      })
      await searchQueue.add(
        'user-search',
        { userId: preference.user_id, runId: run.id },
        {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: { age: 7 * 24 * 60 * 60, count: 5000 },
          removeOnFail: { age: 30 * 24 * 60 * 60, count: 5000 },
        }
      )
      queued += 1
    } catch (error) {
      logger.error(
        `Could not dispatch automation for ${preference.user_id}:`,
        error
      )
    }
  }

  logger.info(`Automation dispatcher queued ${queued} user searches`)
  return { queued }
}

async function runUserSearch(userId: string, runId: string) {
  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: 'processing', started_at: new Date(), error: null },
  })

  try {
    const [preference, profile, resume] = await Promise.all([
      prisma.automationPreference.findUnique({ where: { user_id: userId } }),
      prisma.profile.findUnique({ where: { user_id: userId } }),
      prisma.resume.findFirst({
        where: { user_id: userId, is_default: true },
        orderBy: { updated_at: 'desc' },
      }),
    ])
    if (
      !preference?.enabled ||
      !profile?.preferred_role ||
      !resume?.parsed_data
    ) {
      throw new Error(
        'Automation requires an enabled preference, profile, and parsed resume'
      )
    }

    const parsedResume = resume.parsed_data as unknown as ParsedResumeData
    const result = await searchJobs({
      preferredRole: profile.preferred_role,
      preferredCompanies: profile.preferred_companies,
    })
    const matches = result.jobs
      .map((candidate) => ({
        candidate,
        match: scoreCandidate(candidate, profile, parsedResume),
      }))
      .filter(
        ({ match }) => match.eligible && match.score >= preference.minimum_match
      )
      .sort((a, b) => b.match.score - a.match.score)

    let matchesSaved = 0
    let draftsQueued = 0
    for (const { candidate, match } of matches) {
      const existing = await prisma.job.findFirst({
        where: {
          OR: [
            { external_id: candidate.externalId },
            { fingerprint: candidate.fingerprint },
          ],
        },
      })
      const savedJob = existing
        ? await prisma.job.update({
            where: { id: existing.id },
            data: {
              title: candidate.title,
              company: candidate.company,
              description: candidate.description,
              location: candidate.location,
              url: candidate.url,
              fingerprint: candidate.fingerprint,
              recipient_email: candidate.recipientEmail,
              tags: candidate.tags,
              job_type: candidate.jobType,
              salary_min: candidate.salaryMin,
              salary_max: candidate.salaryMax,
              salary_currency: candidate.salaryCurrency,
              posted_at: candidate.postedAt,
              status: 'active',
            },
          })
        : await prisma.job.create({
            data: {
              external_id: candidate.externalId,
              source: candidate.source,
              title: candidate.title,
              company: candidate.company,
              description: candidate.description,
              location: candidate.location,
              url: candidate.url,
              fingerprint: candidate.fingerprint,
              recipient_email: candidate.recipientEmail,
              tags: candidate.tags,
              job_type: candidate.jobType,
              salary_min: candidate.salaryMin,
              salary_max: candidate.salaryMax,
              salary_currency: candidate.salaryCurrency,
              posted_at: candidate.postedAt,
              status: 'active',
            },
          })

      await prisma.savedJob.upsert({
        where: { user_id_job_id: { user_id: userId, job_id: savedJob.id } },
        update: {
          match_score: match.score,
          missing_skills: match.missingSkills,
        },
        create: {
          user_id: userId,
          job_id: savedJob.id,
          match_score: match.score,
          missing_skills: match.missingSkills,
        },
      })
      matchesSaved += 1

      if (preference.create_email_drafts && draftsQueued < MAX_DRAFTS_PER_RUN) {
        const draft = await prisma.emailDraft.findFirst({
          where: { user_id: userId, job_id: savedJob.id },
        })
        if (!draft) {
          await emailQueue.add(
            'generate-draft',
            {
              userId,
              jobId: savedJob.id,
              resumeId: resume.id,
              runId,
              createGmailDraft:
                preference.create_gmail_drafts &&
                Boolean(candidate.recipientEmail),
            },
            {
              jobId: `draft-${userId}-${savedJob.id}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 30_000 },
              removeOnComplete: { age: 7 * 24 * 60 * 60, count: 5000 },
              removeOnFail: { age: 30 * 24 * 60 * 60, count: 5000 },
            }
          )
          draftsQueued += 1
        }
      }
    }

    await prisma.$transaction([
      prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          jobs_scanned: result.jobs.length,
          matches_saved: matchesSaved,
          source_counts: result.sourceCounts,
          completed_at: new Date(),
        },
      }),
      prisma.automationPreference.update({
        where: { user_id: userId },
        data: { last_run_at: new Date() },
      }),
    ])

    return { jobsScanned: result.jobs.length, matchesSaved, draftsQueued }
  } catch (error) {
    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completed_at: new Date(),
      },
    })
    throw error
  }
}

const searchWorker = new Worker(
  'job-search',
  async (job) => {
    if (job.name === 'automation-dispatch') return dispatchAutomation()
    if (job.name === 'user-search') {
      return runUserSearch(String(job.data.userId), String(job.data.runId))
    }
    throw new Error(`Unknown search job: ${job.name}`)
  },
  { connection, concurrency: 3 }
)

searchWorker.on('completed', (job) =>
  logger.info(`Search job ${job.id} completed`)
)
searchWorker.on('failed', (job, error) =>
  logger.error(`Search job ${job?.id} failed:`, error)
)

async function start() {
  await searchQueue.add(
    'automation-dispatch',
    {},
    {
      jobId: 'automation-dispatch-schedule',
      repeat: { pattern: '*/15 * * * *' },
      removeOnComplete: true,
    }
  )
  await searchQueue.add('automation-dispatch', {}, { removeOnComplete: true })
  logger.info('Search automation worker started')
}

void start().catch((error) => {
  logger.error('Could not start search automation:', error)
  process.exit(1)
})

async function shutdown() {
  await Promise.all([
    searchWorker.close(),
    searchQueue.close(),
    emailQueue.close(),
  ])
  await connection.quit()
}

process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())
