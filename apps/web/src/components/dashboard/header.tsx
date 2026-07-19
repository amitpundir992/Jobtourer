'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BriefcaseBusiness, FileCheck2, Loader2, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/logout-button'
import { ThemeToggle } from '@/components/theme-toggle'

interface SearchResult {
  id: string
  type: 'job' | 'application'
  title: string
  subtitle: string
  meta: string | null
  href: string
}

export function DashboardHeader() {
  const router = useRouter()
  const requestId = useRef(0)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const search = query.trim()
    if (search.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const currentRequest = ++requestId.current
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(search)}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Search failed')
        const data = (await response.json()) as { results?: SearchResult[] }
        if (currentRequest === requestId.current) {
          setResults(data.results ?? [])
          setOpen(true)
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setResults([])
        }
      } finally {
        if (currentRequest === requestId.current) setLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const search = query.trim()
    if (!search) return
    navigate(`/jobs?search=${encodeURIComponent(search)}`)
  }

  return (
    <header className="dashboard-header flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
      <form
        className="relative w-full max-w-md"
        role="search"
        onSubmit={submitSearch}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
        }}
      >
        <input
          aria-label="Search jobs, companies, and applications"
          autoComplete="off"
          className="h-10 w-full rounded-md border bg-background/80 pl-3 pr-10 text-sm outline-none backdrop-blur focus:ring-2 focus:ring-ring"
          placeholder="Search jobs, companies, applications"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
        />
        <button
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          type="submit"
          aria-label="Search"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>

        {open ? (
          <div
            id="global-search-results"
            className="absolute left-0 right-0 top-12 z-50 max-h-80 overflow-y-auto rounded-md border bg-background py-1 shadow-lg"
          >
            {results.length ? (
              results.map((result) => {
                const Icon =
                  result.type === 'job' ? BriefcaseBusiness : FileCheck2
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                    type="button"
                    onClick={() => navigate(result.href)}
                  >
                    <Icon className="h-4 w-4 flex-none text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {result.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    </span>
                    {result.meta ? (
                      <span className="flex-none text-xs capitalize text-muted-foreground">
                        {result.meta}
                      </span>
                    ) : null}
                  </button>
                )
              })
            ) : !loading ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                No matching jobs or applications.
              </p>
            ) : null}
          </div>
        ) : null}
      </form>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
      <div className="md:hidden">
        <LogoutButton compact />
      </div>
    </header>
  )
}
