import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { config } from 'dotenv'
import path from 'node:path'
import { prisma } from '@jobtourer/database'
import { logger } from './lib/logger'
import { generateEmailDraft } from './services/email-generation.service'
import { createGmailDraft } from './services/gmail.service'

config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '../../.env') })

function redisUrl() {
  return (process.env.REDIS_URL || 'redis://localhost:6379')
    .trim()
    .replace(/^[\\"']+|[\\"']+$/g, '')
}

const connection = new Redis(
  redisUrl(),
  { maxRetriesPerRequest: null }
)

const emailWorker = new Worker(
  'email-generation',
  async (job) => {
    const { userId, jobId, resumeId, runId, createGmailDraft: syncGmail } =
      job.data as {
        userId: string
        jobId: string
        resumeId: string
        runId?: string
        createGmailDraft?: boolean
      }

    const draft = await generateEmailDraft({ userId, jobId, resumeId })
    let gmailDraftId: string | null = null
    if (syncGmail && draft.recipientEmail) {
      try {
        gmailDraftId = await createGmailDraft(userId, draft.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await prisma.emailDraft.update({
          where: { id: draft.id },
          data: { gmail_error: message },
        })
        logger.warn(`Gmail draft creation failed: ${message}`)
      }
    }

    if (runId) {
      await prisma.automationRun.updateMany({
        where: { id: runId },
        data: {
          drafts_created: { increment: 1 },
          gmail_drafts_created: gmailDraftId ? { increment: 1 } : undefined,
        },
      })
    }

    return { emailDraftId: draft.id, gmailDraftId }
  },
  { connection, concurrency: 3 }
)

emailWorker.on('completed', (job) => logger.info(`Email job ${job.id} completed`))
emailWorker.on('failed', (job, error) =>
  logger.error(`Email job ${job?.id} failed:`, error)
)

logger.info('Email automation worker started')

async function shutdown() {
  await emailWorker.close()
  await connection.quit()
}

process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())
