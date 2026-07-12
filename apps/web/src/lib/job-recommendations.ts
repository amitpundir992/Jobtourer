import { prisma } from '@jobtourer/database'
import type { ParsedResumeData } from '@jobtourer/types'

const MAX_SOURCE_JOBS = 500
const MAX_RECOMMENDATIONS = 25

interface RemoteOkJob {
  id?: string | number
  position?: string
  company?: string
  description?: string
  location?: string
  url?: string
  tags?: string[]
  salary_min?: number
  salary_max?: number
  date?: string
}

interface CandidateJob {
  externalId: string
  title: string
  company: string
  description: string
  location: string
  url: string
  tags: string[]
  salaryMin?: number
  salaryMax?: number
  postedAt?: Date
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]/g, '')
}

function scoreCandidate(
  job: CandidateJob,
  profile: {
    preferred_role: string | null
    skills: string[]
    preferred_locations: string[]
    work_preference: string | null
    salary_min: number | null
  },
  parsedResume: ParsedResumeData | null
) {
  const skills = Array.from(
    new Set([...(profile.skills ?? []), ...(parsedResume?.skills ?? [])])
  ).filter(Boolean)
  const searchableJob = normalize(
    `${job.title} ${job.description} ${job.tags.join(' ')}`
  )
  const matchingSkills = skills.filter((skill) =>
    searchableJob.includes(normalize(skill))
  )
  const skillScore = skills.length ? matchingSkills.length / skills.length : 0

  const roleTerms = (profile.preferred_role ?? '')
    .split(/\s+/)
    .map(normalize)
    .filter((term) => term.length > 2 && !['engineer', 'developer'].includes(term))
  const normalizedTitle = normalize(job.title)
  const roleScore = roleTerms.length
    ? roleTerms.filter((term) => normalizedTitle.includes(term)).length /
      roleTerms.length
    : 0

  const wantsRemote =
    profile.work_preference?.toLowerCase() === 'remote' ||
    profile.preferred_locations.some((location) =>
      location.toLowerCase().includes('remote')
    )
  const locationScore = wantsRemote
    ? /remote|worldwide|anywhere/i.test(job.location) ||
      job.tags.some((tag) => /remote/i.test(tag))
      ? 1
      : 0
    : profile.preferred_locations.some((location) =>
          job.location.toLowerCase().includes(location.toLowerCase())
        )
      ? 1
      : 0.5

  const salaryScore =
    !profile.salary_min || !job.salaryMax
      ? 0.5
      : job.salaryMax >= profile.salary_min
        ? 1
        : 0

  const score = Math.min(
    1,
    0.15 + skillScore * 0.45 + roleScore * 0.25 + locationScore * 0.1 + salaryScore * 0.05
  )
  const normalizedSkills = new Set(skills.map(normalize))
  const missingSkills = job.tags
    .filter((tag) => !normalizedSkills.has(normalize(tag)))
    .filter((tag) => tag.length > 1)
    .slice(0, 8)

  return { score, missingSkills, isRelevant: skillScore > 0 || roleScore > 0 }
}

async function fetchRemoteOkJobs(): Promise<CandidateJob[]> {
  const response = await fetch('https://remoteok.com/api', {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'JobTourer/1.0 (job recommendation service)',
    },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`RemoteOK returned ${response.status}`)
  }

  const data = (await response.json()) as RemoteOkJob[]

  return data
    .filter(
      (job) =>
        job.id && job.position && job.company && job.url && job.description
    )
    .slice(0, MAX_SOURCE_JOBS)
    .map((job) => ({
      externalId: `remoteok-${job.id}`,
      title: job.position!,
      company: job.company!,
      description: cleanText(job.description!),
      location: job.location || 'Remote',
      url: job.url!,
      tags: Array.isArray(job.tags) ? job.tags : [],
      salaryMin: job.salary_min || undefined,
      salaryMax: job.salary_max || undefined,
      postedAt: job.date && !Number.isNaN(Date.parse(job.date))
        ? new Date(job.date)
        : undefined,
    }))
}

export async function recommendJobsForUser(userId: string) {
  const [profile, resume] = await Promise.all([
    prisma.profile.findUnique({ where: { user_id: userId } }),
    prisma.resume.findFirst({
      where: { user_id: userId, is_default: true },
      orderBy: { updated_at: 'desc' },
    }),
  ])

  if (!profile) {
    throw new Error('Complete your profile before finding recommendations.')
  }

  const parsedResume = (resume?.parsed_data as ParsedResumeData | null) ?? null
  const candidates = await fetchRemoteOkJobs()
  const ranked = candidates
    .map((job) => ({
      job,
      ...scoreCandidate(job, profile, parsedResume),
    }))
    .filter(({ isRelevant }) => isRelevant)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECOMMENDATIONS)

  await Promise.all(
    ranked.map(async ({ job, score, missingSkills }) => {
      const savedJob = await prisma.job.upsert({
        where: { external_id: job.externalId },
        update: {
          title: job.title,
          company: job.company,
          description: job.description,
          location: job.location,
          url: job.url,
          tags: job.tags,
          salary_min: job.salaryMin,
          salary_max: job.salaryMax,
          posted_at: job.postedAt,
          status: 'active',
        },
        create: {
          external_id: job.externalId,
          source: 'remoteok',
          title: job.title,
          company: job.company,
          description: job.description,
          location: job.location,
          job_type: 'remote',
          salary_min: job.salaryMin,
          salary_max: job.salaryMax,
          salary_currency: 'USD',
          url: job.url,
          tags: job.tags,
          posted_at: job.postedAt,
          status: 'active',
        },
      })

      await prisma.savedJob.upsert({
        where: {
          user_id_job_id: { user_id: userId, job_id: savedJob.id },
        },
        update: { match_score: score, missing_skills: missingSkills },
        create: {
          user_id: userId,
          job_id: savedJob.id,
          match_score: score,
          missing_skills: missingSkills,
        },
      })
    })
  )

  return {
    source: 'remoteok',
    jobsScanned: candidates.length,
    recommendationsSaved: ranked.length,
  }
}
