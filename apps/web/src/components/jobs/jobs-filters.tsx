'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { JobQuery } from '@/lib/job-query'
import { FindRecommendationsButton } from './find-recommendations-button'

type FilterOverrides = Partial<
  Pick<
    JobQuery,
    'search' | 'location' | 'source' | 'minMatch' | 'sort' | 'pageSize'
  >
>

export function JobsFilters({
  query,
  onQueryChange,
}: {
  query: JobQuery
  onQueryChange: (query: JobQuery) => void
}) {
  const textTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showFilters, setShowFilters] = useState(
    Boolean(
      query.location ||
        query.source !== 'all' ||
        query.minMatch > 0 ||
        query.sort !== 'newest' ||
        query.pageSize !== 15
    )
  )
  const [search, setSearch] = useState(query.search)
  const [location, setLocation] = useState(query.location)
  const [source, setSource] = useState(query.source)
  const [minMatch, setMinMatch] = useState(query.minMatch)
  const [sort, setSort] = useState(query.sort)
  const [pageSize, setPageSize] = useState(query.pageSize)

  useEffect(
    () => () => {
      if (textTimer.current) clearTimeout(textTimer.current)
    },
    []
  )

  function navigate(overrides: FilterOverrides = {}) {
    const next = {
      search,
      location,
      source,
      minMatch,
      sort,
      pageSize,
      ...overrides,
    }
    onQueryChange({ ...query, ...next, page: 1 })
  }

  function scheduleTextFilter(overrides: FilterOverrides) {
    if (textTimer.current) clearTimeout(textTimer.current)
    textTimer.current = setTimeout(() => navigate(overrides), 350)
  }

  function applyImmediately(overrides: FilterOverrides) {
    if (textTimer.current) clearTimeout(textTimer.current)
    navigate(overrides)
  }

  function clearFilters() {
    if (textTimer.current) clearTimeout(textTimer.current)
    setSearch('')
    setLocation('')
    setSource('all')
    setMinMatch(0)
    setSort('newest')
    setPageSize(15)
    onQueryChange({
      search: '',
      location: '',
      source: 'all',
      minMatch: 0,
      sort: 'newest',
      page: 1,
      pageSize: 15,
    })
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            onChange={(event) => {
              const value = event.target.value
              setSearch(value)
              scheduleTextFilter({ search: value })
            }}
            placeholder="Search roles, companies, locations"
            type="search"
            value={search}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            aria-expanded={showFilters}
            onClick={() => setShowFilters((current) => !current)}
            type="button"
            variant="outline"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <FindRecommendationsButton />
        </div>
      </div>

      {showFilters ? (
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-sm">
            <span>Location</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
              onChange={(event) => {
                const value = event.target.value
                setLocation(value)
                scheduleTextFilter({ location: value })
              }}
              placeholder="Remote, India, London"
              value={location}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Source</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              onChange={(event) => {
                const value = event.target.value as JobQuery['source']
                setSource(value)
                applyImmediately({ source: value })
              }}
              value={source}
            >
              <option value="all">All sources</option>
              <option value="greenhouse">Greenhouse</option>
              <option value="lever">Lever</option>
              <option value="remoteok">Remote OK</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Minimum match</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              onChange={(event) => {
                const value = Number(event.target.value)
                setMinMatch(value)
                applyImmediately({ minMatch: value })
              }}
              value={minMatch}
            >
              <option value="0">Any match</option>
              <option value="40">40% and above</option>
              <option value="50">50% and above</option>
              <option value="60">60% and above</option>
              <option value="75">75% and above</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Sort by</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              onChange={(event) => {
                const value = event.target.value as JobQuery['sort']
                setSort(value)
                applyImmediately({ sort: value })
              }}
              value={sort}
            >
              <option value="newest">Newest jobs</option>
              <option value="match">Best match</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Jobs per page</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              onChange={(event) => {
                const value = Number(event.target.value)
                setPageSize(value)
                applyImmediately({ pageSize: value })
              }}
              value={pageSize}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
            </select>
          </label>
          <div className="sm:col-span-2 xl:col-span-5">
            <Button onClick={clearFilters} type="button" variant="ghost">
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
