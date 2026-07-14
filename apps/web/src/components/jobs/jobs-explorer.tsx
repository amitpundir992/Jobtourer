'use client'

import { useMemo, useState } from 'react'

import type { JobQuery } from '@/lib/job-query'
import { JobsFilters } from './jobs-filters'
import { JobsTable } from './jobs-table'

export interface JobCatalogItem {
  id: string
  match_score: number | null
  created_at: Date | string
  job: {
    id: string
    title: string
    company: string
    location: string | null
    source: string
    url: string
    posted_at: Date | string | null
  }
}

function dateValue(value: Date | string | null | undefined) {
  return value ? new Date(value).getTime() : 0
}

function filterJobCatalog(catalog: JobCatalogItem[], query: JobQuery) {
  const search = query.search.trim().toLowerCase()
  const location = query.location.trim().toLowerCase()
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
      return (
        dateValue(right.job.posted_at ?? right.created_at) -
        dateValue(left.job.posted_at ?? left.created_at)
      )
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

function queryUrl(query: JobQuery) {
  const params = new URLSearchParams()
  if (query.search.trim()) params.set('search', query.search.trim())
  if (query.location.trim()) params.set('location', query.location.trim())
  if (query.source !== 'all') params.set('source', query.source)
  if (query.minMatch > 0) params.set('minMatch', String(query.minMatch))
  if (query.sort !== 'newest') params.set('sort', query.sort)
  if (query.pageSize !== 15) params.set('pageSize', String(query.pageSize))
  if (query.page > 1) params.set('page', String(query.page))
  return params.size ? `/jobs?${params}` : '/jobs'
}

export function JobsExplorer({
  catalog,
  initialQuery,
}: {
  catalog: JobCatalogItem[]
  initialQuery: JobQuery
}) {
  const [query, setQuery] = useState(initialQuery)
  const result = useMemo(
    () => filterJobCatalog(catalog, query),
    [catalog, query]
  )

  function updateQuery(nextQuery: JobQuery) {
    setQuery(nextQuery)
    window.history.replaceState(null, '', queryUrl(nextQuery))
  }

  return (
    <>
      <JobsFilters query={query} onQueryChange={updateQuery} />
      <JobsTable
        query={query}
        recommendations={result.recommendations}
        pagination={result.pagination}
        onPageChange={(page) => updateQuery({ ...query, page })}
      />
    </>
  )
}
