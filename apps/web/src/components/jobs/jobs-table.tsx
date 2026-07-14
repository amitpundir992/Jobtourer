import Link from 'next/link'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getJobRecommendations, type JobQuery } from '@/lib/job-query'
import { getServerSession } from '@/lib/server-session'

const sourceDetails: Record<string, { label: string; url: string }> = {
  greenhouse: { label: 'Greenhouse', url: 'https://www.greenhouse.com' },
  lever: { label: 'Lever', url: 'https://www.lever.co' },
  remoteok: { label: 'Remote OK', url: 'https://remoteok.com' },
}

function pageHref(query: JobQuery, page: number) {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.location) params.set('location', query.location)
  if (query.source !== 'all') params.set('source', query.source)
  if (query.minMatch > 0) params.set('minMatch', String(query.minMatch))
  if (query.sort !== 'newest') params.set('sort', query.sort)
  if (query.pageSize !== 15) params.set('pageSize', String(query.pageSize))
  if (page > 1) params.set('page', String(page))
  const search = params.toString()
  return search ? `/jobs?${search}` : '/jobs'
}

function paginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const visiblePages =
    currentPage <= 5
      ? [1, 2, 3, 4, 5, 6, totalPages]
      : currentPage >= totalPages - 4
        ? [
            1,
            totalPages - 5,
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
          ]
        : [
            1,
            currentPage - 2,
            currentPage - 1,
            currentPage,
            currentPage + 1,
            currentPage + 2,
            totalPages,
          ]
  const pages = Array.from(new Set(visiblePages))
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
  const items: Array<number | string> = []

  pages.forEach((page, index) => {
    const previousPage = pages[index - 1]
    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}`)
    }
    items.push(page)
  })

  return items
}

export async function JobsTable({ query }: { query: JobQuery }) {
  const session = await getServerSession()
  const { recommendations, pagination } = session
    ? await getJobRecommendations(session.user.id, query)
    : {
        recommendations: [],
        pagination: {
          page: 1,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }
  const firstResult =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
  const lastResult = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total
  )
  const hasFilters = Boolean(
    query.search ||
      query.location ||
      query.source !== 'all' ||
      query.minMatch > 0
  )
  const pageItems = paginationItems(pagination.page, pagination.totalPages)

  return (
    <div className="rounded-lg border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Match</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                {hasFilters
                  ? 'No recommendations match the current filters.'
                  : 'No job matches yet. Select Find recommendations to search for real jobs using your profile and resume.'}
              </td>
            </tr>
          ) : (
            recommendations.map((recommendation) => (
              <tr key={recommendation.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  <a
                    className="hover:underline"
                    href={recommendation.job.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {recommendation.job.title}
                  </a>
                </td>
                <td className="px-4 py-3">{recommendation.job.company}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {recommendation.job.location ?? '-'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <a
                    className="hover:underline"
                    href={
                      sourceDetails[recommendation.job.source]?.url ??
                      recommendation.job.url
                    }
                    target="_blank"
                  >
                    {sourceDetails[recommendation.job.source]?.label ??
                      recommendation.job.source}
                  </a>
                </td>
                <td className="px-4 py-3 font-semibold text-green-600">
                  {recommendation.match_score !== null
                    ? `${Math.round(recommendation.match_score * 100)}%`
                    : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {firstResult}-{lastResult} of {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          {pagination.hasPreviousPage ? (
            <Button asChild size="sm" variant="outline">
              <Link href={pageHref(query, pagination.page - 1)} prefetch>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
          )}
          <div className="flex items-center gap-1" aria-label="Pages">
            {pageItems.map((item) =>
              typeof item === 'number' ? (
                item === pagination.page ? (
                  <Button
                    aria-current="page"
                    className="h-8 w-8 p-0"
                    key={item}
                    size="sm"
                  >
                    {item}
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="h-8 w-8 p-0"
                    key={item}
                    size="sm"
                    variant="ghost"
                  >
                    <Link href={pageHref(query, item)} prefetch>
                      {item}
                    </Link>
                  </Button>
                )
              ) : (
                <span
                  className="flex h-8 w-8 items-center justify-center text-muted-foreground"
                  key={item}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            )}
          </div>
          {pagination.hasNextPage ? (
            <Button asChild size="sm" variant="outline">
              <Link href={pageHref(query, pagination.page + 1)} prefetch>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
