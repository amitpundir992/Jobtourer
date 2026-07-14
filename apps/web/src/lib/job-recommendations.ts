import { prisma } from '@jobtourer/database'
import type { ParsedResumeData } from '@jobtourer/types'

const MAX_SOURCE_JOBS = 500
const MAX_RECOMMENDATIONS = 100
const DEFAULT_GREENHOUSE_BOARDS = ['cloudflare', 'datadog', 'mongodb']
const DEFAULT_LEVER_SITES = ['palantir', 'spotify', 'highspot', 'aircall']

const COMPANY_NAMES: Record<string, string> = {
  aircall: 'Aircall',
  cloudflare: 'Cloudflare',
  datadog: 'Datadog',
  highspot: 'Highspot',
  mongodb: 'MongoDB',
  palantir: 'Palantir',
  spotify: 'Spotify',
}

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

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  content?: string
  updated_at?: string
  location?: { name?: string }
  departments?: Array<{ name?: string }>
}

interface LeverJob {
  id: string
  text: string
  hostedUrl: string
  descriptionPlain?: string
  additionalPlain?: string
  createdAt?: number
  categories?: {
    location?: string
    team?: string
    commitment?: string
  }
}

interface CandidateJob {
  externalId: string
  source: 'remoteok' | 'greenhouse' | 'lever'
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

function configuredSources(name: string, defaults: string[]) {
  const configured = process.env[name]
    ?.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return configured?.length ? configured : defaults
}

function companySlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function unique(values: string[]) {
  return Array.from(new Set(values))
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
      source: 'remoteok' as const,
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

async function fetchGreenhouseJobs(boards: string[]): Promise<CandidateJob[]> {
  const results = await Promise.allSettled(
    boards.map(async (board) => {
      const response = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`,
        { signal: AbortSignal.timeout(15_000), cache: 'no-store' }
      )
      if (!response.ok) return []

      const data = (await response.json()) as { jobs?: GreenhouseJob[] }
      return (data.jobs ?? []).slice(0, MAX_SOURCE_JOBS).map((job) => ({
        externalId: `greenhouse-${board}-${job.id}`,
        source: 'greenhouse' as const,
        title: job.title,
        company: COMPANY_NAMES[board] ?? board,
        description: cleanText(job.content ?? ''),
        location: job.location?.name || 'See job posting',
        url: job.absolute_url,
        tags: (job.departments ?? [])
          .map((department) => department.name)
          .filter((name): name is string => Boolean(name)),
        postedAt:
          job.updated_at && !Number.isNaN(Date.parse(job.updated_at))
            ? new Date(job.updated_at)
            : undefined,
      }))
    })
  )

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
}

async function fetchLeverJobs(sites: string[]): Promise<CandidateJob[]> {
  const results = await Promise.allSettled(
    sites.map(async (site) => {
      const response = await fetch(
        `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`,
        { signal: AbortSignal.timeout(15_000), cache: 'no-store' }
      )
      if (!response.ok) return []

      const data = (await response.json()) as LeverJob[]
      return data.slice(0, MAX_SOURCE_JOBS).map((job) => ({
        externalId: `lever-${site}-${job.id}`,
        source: 'lever' as const,
        title: job.text,
        company: COMPANY_NAMES[site] ?? site,
        description: cleanText(
          `${job.descriptionPlain ?? ''} ${job.additionalPlain ?? ''}`
        ),
        location: job.categories?.location || 'See job posting',
        url: job.hostedUrl,
        tags: [job.categories?.team, job.categories?.commitment].filter(
          (tag): tag is string => Boolean(tag)
        ),
        postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
      }))
    })
  )

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
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
  const preferredCompanySlugs = profile.preferred_companies
    .map(companySlug)
    .filter(Boolean)
  const greenhouseBoards = unique([
    ...configuredSources('GREENHOUSE_BOARD_TOKENS', DEFAULT_GREENHOUSE_BOARDS),
    ...preferredCompanySlugs,
  ])
  const leverSites = unique([
    ...configuredSources('LEVER_SITE_NAMES', DEFAULT_LEVER_SITES),
    ...preferredCompanySlugs,
  ])
  const sourceResults = await Promise.allSettled([
    fetchRemoteOkJobs(),
    fetchGreenhouseJobs(greenhouseBoards),
    fetchLeverJobs(leverSites),
  ])
  const [remoteOkJobs, greenhouseJobs, leverJobs] = sourceResults.map(
    (result) => (result.status === 'fulfilled' ? result.value : [])
  )
  const candidates = [...remoteOkJobs, ...greenhouseJobs, ...leverJobs]
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
          source: job.source,
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
    sources: {
      remoteok: remoteOkJobs.length,
      greenhouse: greenhouseJobs.length,
      lever: leverJobs.length,
    },
    jobsScanned: candidates.length,
    recommendationsSaved: ranked.length,
  }
}
