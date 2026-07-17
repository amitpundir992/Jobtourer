import { createHash } from 'node:crypto'
import { logger } from '../lib/logger'

const MAX_SOURCE_JOBS = 500
const DEFAULT_GREENHOUSE_BOARDS = ['cloudflare', 'datadog', 'mongodb']
const DEFAULT_LEVER_SITES = ['palantir', 'spotify', 'highspot', 'aircall']
const DEFAULT_ASHBY_BOARDS = ['openai', 'anthropic', 'linear']
const DEFAULT_SMARTRECRUITERS_COMPANIES = ['BoschGroup', 'Visa']

export interface SearchPreferences {
  preferredRole: string
  preferredCompanies: string[]
}

export interface CandidateJob {
  externalId: string
  fingerprint: string
  source: 'remoteok' | 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters'
  title: string
  company: string
  description: string
  location: string
  url: string
  tags: string[]
  jobType?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  postedAt?: Date
  recipientEmail?: string
}

interface SourceResult {
  source: CandidateJob['source']
  jobs: CandidateJob[]
}

function configured(name: string, defaults: string[], lowercase = true) {
  const values = process.env[name]
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (lowercase ? value.toLowerCase() : value))
  return values?.length ? values : defaults
}

function cleanText(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function canonicalUrl(value: string) {
  try {
    const url = new URL(value)
    return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/$/, '')}`
  } catch {
    return value.toLowerCase().replace(/[?#].*$/, '').replace(/\/$/, '')
  }
}

function fingerprint(job: Pick<CandidateJob, 'company' | 'title' | 'location' | 'url'>) {
  return createHash('sha256')
    .update(
      [job.company, job.title, job.location, canonicalUrl(job.url)]
        .map(slug)
        .join('|')
    )
    .digest('hex')
}

function recipientEmail(text: string) {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []
  return matches.find((email) =>
    /^(jobs?|careers?|recruit(ing|er)?|talent|hiring|people)@/i.test(email)
  )
}

function withMetadata(job: Omit<CandidateJob, 'fingerprint' | 'recipientEmail'>) {
  return {
    ...job,
    fingerprint: fingerprint(job),
    recipientEmail: recipientEmail(job.description),
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

async function fetchJson<T>(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`${response.status} from ${url}`)
  return (await response.json()) as T
}

async function remoteOk(): Promise<CandidateJob[]> {
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

  const data = await fetchJson<RemoteOkJob[]>('https://remoteok.com/api', {
    Accept: 'application/json',
    'User-Agent': 'JobTourer/1.0 (job recommendation service)',
  })
  return data
    .filter((job) => job.id && job.position && job.company && job.url)
    .slice(0, MAX_SOURCE_JOBS)
    .map((job) =>
      withMetadata({
        externalId: `remoteok-${job.id}`,
        source: 'remoteok',
        title: job.position!,
        company: job.company!,
        description: cleanText(job.description),
        location: job.location || 'Remote',
        url: job.url!,
        tags: job.tags ?? [],
        jobType: 'remote',
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        salaryCurrency: 'USD',
        postedAt: job.date && !Number.isNaN(Date.parse(job.date))
          ? new Date(job.date)
          : undefined,
      })
    )
}

async function greenhouse(boards: string[]): Promise<CandidateJob[]> {
  interface GreenhouseJob {
    id: number
    title: string
    absolute_url: string
    content?: string
    updated_at?: string
    location?: { name?: string }
    departments?: Array<{ name?: string }>
  }

  const results = await Promise.allSettled(
    boards.map(async (board) => {
      const data = await fetchJson<{ jobs?: GreenhouseJob[] }>(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`
      )
      return (data.jobs ?? []).slice(0, MAX_SOURCE_JOBS).map((job) =>
        withMetadata({
          externalId: `greenhouse-${board}-${job.id}`,
          source: 'greenhouse',
          title: job.title,
          company: board,
          description: cleanText(job.content),
          location: job.location?.name || 'See job posting',
          url: job.absolute_url,
          tags: (job.departments ?? [])
            .map((department) => department.name)
            .filter((name): name is string => Boolean(name)),
          postedAt:
            job.updated_at && !Number.isNaN(Date.parse(job.updated_at))
              ? new Date(job.updated_at)
              : undefined,
        })
      )
    })
  )
  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
}

async function lever(sites: string[]): Promise<CandidateJob[]> {
  interface LeverJob {
    id: string
    text: string
    hostedUrl: string
    descriptionPlain?: string
    additionalPlain?: string
    createdAt?: number
    categories?: { location?: string; team?: string; commitment?: string }
  }

  const results = await Promise.allSettled(
    sites.map(async (site) => {
      const data = await fetchJson<LeverJob[]>(
        `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`
      )
      return data.slice(0, MAX_SOURCE_JOBS).map((job) =>
        withMetadata({
          externalId: `lever-${site}-${job.id}`,
          source: 'lever',
          title: job.text,
          company: site,
          description: cleanText(
            `${job.descriptionPlain ?? ''} ${job.additionalPlain ?? ''}`
          ),
          location: job.categories?.location || 'See job posting',
          url: job.hostedUrl,
          tags: [job.categories?.team, job.categories?.commitment].filter(
            (tag): tag is string => Boolean(tag)
          ),
          jobType: job.categories?.commitment,
          postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
        })
      )
    })
  )
  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
}

async function ashby(boards: string[]): Promise<CandidateJob[]> {
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
    compensation?: { compensationTierSummary?: string }
  }

  const results = await Promise.allSettled(
    boards.map(async (board) => {
      const data = await fetchJson<{ jobs?: AshbyJob[] }>(
        `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`
      )
      return (data.jobs ?? []).slice(0, MAX_SOURCE_JOBS).map((job) =>
        withMetadata({
          externalId: `ashby-${board}-${job.id ?? createHash('sha1').update(job.jobUrl).digest('hex')}`,
          source: 'ashby',
          title: job.title,
          company: board,
          description: cleanText(job.descriptionPlain || job.descriptionHtml),
          location: job.location || 'See job posting',
          url: job.applyUrl || job.jobUrl,
          tags: [job.department, job.team, job.employmentType].filter(
            (tag): tag is string => Boolean(tag)
          ),
          jobType: job.employmentType,
          postedAt:
            job.publishedAt && !Number.isNaN(Date.parse(job.publishedAt))
              ? new Date(job.publishedAt)
              : undefined,
        })
      )
    })
  )
  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
}

async function smartRecruiters(companies: string[]): Promise<CandidateJob[]> {
  interface SmartPosting {
    id: string
    name: string
    releasedDate?: string
    refNumber?: string
    location?: { city?: string; region?: string; country?: string }
    department?: { label?: string }
    typeOfEmployment?: { label?: string }
  }

  const results = await Promise.allSettled(
    companies.map(async (company) => {
      const data = await fetchJson<{ content?: SmartPosting[] }>(
        `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?limit=100`
      )
      return Promise.all(
        (data.content ?? []).slice(0, MAX_SOURCE_JOBS).map(async (posting) => {
          const url = `https://jobs.smartrecruiters.com/${company}/${posting.id}`
          let description = ''
          try {
            const detail = await fetchJson<{
              jobAd?: { sections?: Record<string, { text?: string }> }
            }>(
              `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings/${posting.id}`
            )
            description = cleanText(
              Object.values(detail.jobAd?.sections ?? {})
                .map((section) => section.text ?? '')
                .join(' ')
            )
          } catch {
            // The list item is still useful if a detail endpoint is unavailable.
          }

          return withMetadata({
            externalId: `smartrecruiters-${company}-${posting.id}`,
            source: 'smartrecruiters',
            title: posting.name,
            company,
            description,
            location:
              [
                posting.location?.city,
                posting.location?.region,
                posting.location?.country,
              ]
                .filter(Boolean)
                .join(', ') || 'See job posting',
            url,
            tags: [
              posting.department?.label,
              posting.typeOfEmployment?.label,
            ].filter((tag): tag is string => Boolean(tag)),
            jobType: posting.typeOfEmployment?.label,
            postedAt:
              posting.releasedDate && !Number.isNaN(Date.parse(posting.releasedDate))
                ? new Date(posting.releasedDate)
                : undefined,
          })
        })
      )
    })
  )
  return (
    await Promise.all(
      results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : []
      )
    )
  ).flat()
}

export async function searchJobs(preferences: SearchPreferences) {
  const preferredSlugs = preferences.preferredCompanies.map(slug).filter(Boolean)
  const sources: Array<Promise<SourceResult>> = [
    remoteOk().then((jobs) => ({ source: 'remoteok', jobs })),
    greenhouse(
      unique([
        ...configured('GREENHOUSE_BOARD_TOKENS', DEFAULT_GREENHOUSE_BOARDS),
        ...preferredSlugs,
      ])
    ).then((jobs) => ({ source: 'greenhouse', jobs })),
    lever(
      unique([
        ...configured('LEVER_SITE_NAMES', DEFAULT_LEVER_SITES),
        ...preferredSlugs,
      ])
    ).then((jobs) => ({ source: 'lever', jobs })),
    ashby(
      unique([
        ...configured('ASHBY_BOARD_NAMES', DEFAULT_ASHBY_BOARDS),
        ...preferredSlugs,
      ])
    ).then((jobs) => ({ source: 'ashby', jobs })),
    smartRecruiters(
      unique(
        configured(
          'SMARTRECRUITERS_COMPANIES',
          DEFAULT_SMARTRECRUITERS_COMPANIES,
          false
        )
      )
    ).then((jobs) => ({ source: 'smartrecruiters', jobs })),
  ]

  const settled = await Promise.allSettled(sources)
  const sourceCounts: Record<string, number> = {}
  const jobs: CandidateJob[] = []
  settled.forEach((result) => {
    if (result.status === 'fulfilled') {
      sourceCounts[result.value.source] = result.value.jobs.length
      jobs.push(...result.value.jobs)
    } else {
      logger.warn(`Job source failed: ${String(result.reason)}`)
    }
  })

  const deduplicated = Array.from(
    new Map(jobs.map((job) => [job.fingerprint, job])).values()
  )
  return { jobs: deduplicated, sourceCounts }
}
