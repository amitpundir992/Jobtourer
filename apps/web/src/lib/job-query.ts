import { prisma } from '@jobtourer/database'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

export const jobQuerySchema = z.object({
  search: z.string().trim().max(100).catch(''),
  location: z.string().trim().max(100).catch(''),
  source: z
    .enum([
      'all',
      'greenhouse',
      'lever',
      'remoteok',
      'ashby',
      'smartrecruiters',
      'remotive',
      'jobicy',
      'arbeitnow',
    ])
    .catch('all'),
  minMatch: z.coerce.number().int().min(0).max(100).catch(0),
  sort: z.enum(['newest', 'match']).catch('newest'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(25).catch(15),
})

export type JobQuery = z.infer<typeof jobQuerySchema>

export function parseJobQuery(
  input: Record<string, string | string[] | undefined>
): JobQuery {
  const singleValues = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  )

  return jobQuerySchema.parse(singleValues)
}

const getCachedUserRecommendations = unstable_cache(
  (userId: string) =>
    prisma.savedJob.findMany({
      where: { user_id: userId, job: { status: 'active' } },
      select: {
        id: true,
        match_score: true,
        created_at: true,
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            source: true,
            url: true,
            posted_at: true,
          },
        },
      },
    }),
  ['user-recommendations-v2'],
  { revalidate: 60, tags: ['job-recommendations'] }
)

async function queryJobRecommendations(userId: string, query: JobQuery) {
  const search = query.search.trim().toLowerCase()
  const location = query.location.trim().toLowerCase()
  const catalog = await getCachedUserRecommendations(userId)
  const recommendations = catalog
    .filter((recommendation) => {
      const job = recommendation.job
      return (
        (!search ||
          job.title.toLowerCase().includes(search) ||
          job.company.toLowerCase().includes(search) ||
          Boolean(job.location?.toLowerCase().includes(search))) &&
        (!location ||
          Boolean(job.location?.toLowerCase().includes(location))) &&
        (query.source === 'all' || job.source === query.source) &&
        (query.minMatch === 0 ||
          (recommendation.match_score ?? 0) >= query.minMatch / 100)
      )
    })
    .sort((left, right) => {
      if (query.sort === 'match') {
        return (right.match_score ?? 0) - (left.match_score ?? 0)
      }
      const rightDate = new Date(
        right.job.posted_at ?? right.created_at
      ).getTime()
      const leftDate = new Date(left.job.posted_at ?? left.created_at).getTime()
      return rightDate - leftDate
    })
  const total = recommendations.length
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(query.page, totalPages)
  const start = (page - 1) * query.pageSize

  return {
    recommendations: recommendations.slice(start, start + query.pageSize),
    pagination: {
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}

const getCachedJobRecommendations = unstable_cache(
  queryJobRecommendations,
  ['filtered-job-recommendations-v2'],
  { revalidate: 60, tags: ['job-recommendations'] }
)

export function getJobRecommendations(userId: string, query: JobQuery) {
  return getCachedJobRecommendations(userId, query)
}

export function getJobCatalog(userId: string) {
  return getCachedUserRecommendations(userId)
}
