import { createHash } from 'node:crypto'
import { prisma } from '@jobtourer/database'
import type { ParsedResumeData } from '@jobtourer/types'

const MAX_SOURCE_JOBS = 500
const MAX_RECOMMENDATIONS = 100
const DEFAULT_GREENHOUSE_BOARDS = ['cloudflare', 'datadog', 'mongodb']
const DEFAULT_LEVER_SITES = ['palantir', 'spotify', 'highspot', 'aircall']
const DEFAULT_ASHBY_BOARDS = ['openai', 'anthropic', 'linear']
const DEFAULT_SMARTRECRUITERS_COMPANIES = ['BoschGroup', 'Visa']

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

interface AshbyJob {
  id?: string
  title: string
  location?: string
  descriptionPlain?: string
  descriptionHtml?: string
  jobUrl: string
  applyUrl?: string
  department?: string
  team?: string
  employmentType?: string
  publishedAt?: string
}

interface SmartRecruitersJob {
  id: string
  name: string
  releasedDate?: string
  location?: { city?: string; region?: string; country?: string }
  department?: { label?: string }
  typeOfEmployment?: { label?: string }
}

interface CandidateJob {
  externalId: string
  source: 'remoteok' | 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters'
  title: string
  company: string
  description: string
  location: string
  url: string
  tags: string[]
  salaryMin?: number
  salaryMax?: number
  postedAt?: Date
  fingerprint?: string
  recipientEmail?: string
}

function configuredSources(name: string, defaults: string[], lowercase = true) {
  const configured = process.env[name]
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (lowercase ? value.toLowerCase() : value))

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

function jobFingerprint(job: CandidateJob) {
  return createHash('sha256')
    .update(
      [job.company, job.title, job.location, job.url]
        .map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .join('|')
    )
    .digest('hex')
}

function hiringEmail(description: string) {
  const emails =
    description.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []
  return emails.find((email) =>
    /^(jobs?|careers?|recruit(ing|er)?|talent|hiring|people)@/i.test(email)
  )
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
    .filter(
      (term) => term.length > 2 && !['engineer', 'developer'].includes(term)
    )
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
    0.15 +
      skillScore * 0.45 +
      roleScore * 0.25 +
      locationScore * 0.1 +
      salaryScore * 0.05
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
      postedAt:
        job.date && !Number.isNaN(Date.parse(job.date))
          ? new Date(job.date)
          : undefined,
      recipientEmail: hiringEmail(cleanText(job.description!)),
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
        recipientEmail: hiringEmail(cleanText(job.content ?? '')),
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
        recipientEmail: hiringEmail(
          cleanText(
            `${job.descriptionPlain ?? ''} ${job.additionalPlain ?? ''}`
          )
        ),
      }))
    })
  )

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
}

async function fetchAshbyJobs(boards: string[]): Promise<CandidateJob[]> {
  const results = await Promise.allSettled(
    boards.map(async (board) => {
      const response = await fetch(
        `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`,
        { signal: AbortSignal.timeout(15_000), cache: 'no-store' }
      )
      if (!response.ok) return []

      const data = (await response.json()) as { jobs?: AshbyJob[] }
      return (data.jobs ?? []).slice(0, MAX_SOURCE_JOBS).map((job) => {
        const description = cleanText(
          job.descriptionPlain || job.descriptionHtml || ''
        )
        return {
          externalId: `ashby-${board}-${job.id ?? createHash('sha1').update(job.jobUrl).digest('hex')}`,
          source: 'ashby' as const,
          title: job.title,
          company: COMPANY_NAMES[board] ?? board,
          description,
          location: job.location || 'See job posting',
          url: job.applyUrl || job.jobUrl,
          tags: [job.department, job.team, job.employmentType].filter(
            (tag): tag is string => Boolean(tag)
          ),
          postedAt:
            job.publishedAt && !Number.isNaN(Date.parse(job.publishedAt))
              ? new Date(job.publishedAt)
              : undefined,
          recipientEmail: hiringEmail(description),
        }
      })
    })
  )

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
}

async function fetchSmartRecruitersJobs(
  companies: string[]
): Promise<CandidateJob[]> {
  const results = await Promise.allSettled(
    companies.map(async (company) => {
      const response = await fetch(
        `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?limit=100`,
        { signal: AbortSignal.timeout(15_000), cache: 'no-store' }
      )
      if (!response.ok) return []

      const data = (await response.json()) as { content?: SmartRecruitersJob[] }
      return (data.content ?? []).slice(0, MAX_SOURCE_JOBS).map((job) => ({
        externalId: `smartrecruiters-${company}-${job.id}`,
        source: 'smartrecruiters' as const,
        title: job.name,
        company,
        description: [
          job.name,
          job.department?.label,
          job.typeOfEmployment?.label,
        ]
          .filter(Boolean)
          .join(' '),
        location:
          [job.location?.city, job.location?.region, job.location?.country]
            .filter(Boolean)
            .join(', ') || 'See job posting',
        url: `https://jobs.smartrecruiters.com/${company}/${job.id}`,
        tags: [job.department?.label, job.typeOfEmployment?.label].filter(
          (tag): tag is string => Boolean(tag)
        ),
        postedAt:
          job.releasedDate && !Number.isNaN(Date.parse(job.releasedDate))
            ? new Date(job.releasedDate)
            : undefined,
      }))
    })
  )

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
}

interface RecommendationOptions {
  minimumMatch?: number
  maxRecommendations?: number
}

export async function recommendJobsForUser(
  userId: string,
  options: RecommendationOptions = {}
) {
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
  const ashbyBoards = unique([
    ...configuredSources('ASHBY_BOARD_NAMES', DEFAULT_ASHBY_BOARDS),
    ...preferredCompanySlugs,
  ])
  const smartRecruitersCompanies = unique(
    configuredSources(
      'SMARTRECRUITERS_COMPANIES',
      DEFAULT_SMARTRECRUITERS_COMPANIES,
      false
    )
  )
  const sourceResults = await Promise.allSettled([
    fetchRemoteOkJobs(),
    fetchGreenhouseJobs(greenhouseBoards),
    fetchLeverJobs(leverSites),
    fetchAshbyJobs(ashbyBoards),
    fetchSmartRecruitersJobs(smartRecruitersCompanies),
  ])
  const [
    remoteOkJobs,
    greenhouseJobs,
    leverJobs,
    ashbyJobs,
    smartRecruitersJobs,
  ] = sourceResults.map((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
  const candidates = [
    ...remoteOkJobs,
    ...greenhouseJobs,
    ...leverJobs,
    ...ashbyJobs,
    ...smartRecruitersJobs,
  ]
  const scoredCandidates = candidates
    .map((job) => ({
      job,
      ...scoreCandidate(job, profile, parsedResume),
    }))
    .filter(
      ({ isRelevant, score }) =>
        isRelevant && score >= (options.minimumMatch ?? 0)
    )
    .sort((a, b) => b.score - a.score)
  const selectedIds = new Set<string>()
  const sourceBalanced = [
    'remoteok',
    'greenhouse',
    'lever',
    'ashby',
    'smartrecruiters',
  ].flatMap((source) =>
    scoredCandidates
      .filter(({ job }) => job.source === source)
      .slice(0, 10)
      .filter(({ job }) => {
        if (selectedIds.has(job.externalId)) return false
        selectedIds.add(job.externalId)
        return true
      })
  )
  const ranked = [
    ...sourceBalanced,
    ...scoredCandidates.filter(({ job }) => !selectedIds.has(job.externalId)),
  ].slice(0, options.maxRecommendations ?? MAX_RECOMMENDATIONS)

  const savedRecommendations: Array<{
    jobId: string
    score: number
    recipientEmail: string | null
  }> = []

  for (let index = 0; index < ranked.length; index += 5) {
    const batch = ranked.slice(index, index + 5)
    const savedBatch = await Promise.all(
      batch.map(async ({ job, score, missingSkills }) => {
        const fingerprint = job.fingerprint ?? jobFingerprint(job)
        const savedJob = await prisma.job.upsert({
          where: { external_id: job.externalId },
          update: {
            title: job.title,
            company: job.company,
            description: job.description,
            location: job.location,
            url: job.url,
            fingerprint,
            recipient_email: job.recipientEmail,
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
            fingerprint,
            recipient_email: job.recipientEmail,
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

        return {
          jobId: savedJob.id,
          score,
          recipientEmail: job.recipientEmail ?? null,
        }
      })
    )
    savedRecommendations.push(...savedBatch)
  }

  const recommendationSources = ranked.reduce(
    (counts, { job }) => {
      counts[job.source] += 1
      return counts
    },
    { remoteok: 0, greenhouse: 0, lever: 0, ashby: 0, smartrecruiters: 0 }
  )

  return {
    sources: {
      remoteok: remoteOkJobs.length,
      greenhouse: greenhouseJobs.length,
      lever: leverJobs.length,
      ashby: ashbyJobs.length,
      smartrecruiters: smartRecruitersJobs.length,
    },
    recommendationSources,
    jobsScanned: candidates.length,
    recommendationsSaved: ranked.length,
    savedRecommendations,
  }
}
