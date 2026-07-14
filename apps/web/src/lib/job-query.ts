import { prisma } from '@jobtourer/database'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

export const jobQuerySchema = z.object({
  search: z.string().trim().max(100).catch(''),
  location: z.string().trim().max(100).catch(''),
  source: z.enum(['all', 'greenhouse', 'lever', 'remoteok']).catch('all'),
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

const getUserRecommendations = unstable_cache(
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

function dateValue(value: Date | string | null | undefined) {
  return value ? new Date(value).getTime() : 0
}

async function queryJobRecommendations(userId: string, query: JobQuery) {
  const search = query.search.toLowerCase()
  const location = query.location.toLowerCase()
  const recommendations = (await getUserRecommendations(userId))
    .filter((recommendation) => {
      const job = recommendation.job
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search) ||
        job.location?.toLowerCase().includes(search)
      const matchesLocation =
        !location || job.location?.toLowerCase().includes(location)
      const matchesSource =
        query.source === 'all' || job.source === query.source
      const matchesScore =
        query.minMatch === 0 ||
        (recommendation.match_score ?? 0) >= query.minMatch / 100

      return matchesSearch && matchesLocation && matchesSource && matchesScore
    })
    .sort((left, right) => {
      if (query.sort === 'match') {
        return (right.match_score ?? 0) - (left.match_score ?? 0)
      }

      return (
        dateValue(right.job.posted_at ?? right.created_at) -
        dateValue(left.job.posted_at ?? left.created_at)
      )
    })

  const total = recommendations.length
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(query.page, totalPages)
  const pageStart = (page - 1) * query.pageSize
  const paginatedRecommendations = recommendations.slice(
    pageStart,
    pageStart + query.pageSize
  )

  return {
    recommendations: paginatedRecommendations,
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
