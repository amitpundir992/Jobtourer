'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function FindRecommendationsButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function findRecommendations() {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/jobs/recommendations', {
        method: 'POST',
      })
      const result = (await response.json()) as {
        error?: string
        jobsScanned?: number
        recommendationsSaved?: number
        sources?: Record<string, number>
        recommendationSources?: Record<string, number>
      }

      if (!response.ok) {
        throw new Error(result.error || 'Could not find recommendations.')
      }

      const saved = result.recommendationsSaved ?? 0
      const savedSources = Object.entries(result.recommendationSources ?? {})
        .map(
          ([source, count]) =>
            `${source === 'remoteok' ? 'Remote OK' : source[0].toUpperCase() + source.slice(1)} ${count}`
        )
        .join(', ')
      setMessage(
        saved > 0
          ? `Saved ${saved}: ${savedSources || 'no source details'} (${result.jobsScanned ?? 0} scanned)`
          : `No relevant matches in ${result.jobsScanned ?? 0} scanned jobs`
      )
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Search failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <Button type="button" onClick={findRecommendations} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isLoading ? 'Finding jobs...' : 'Find recommendations'}
      </Button>
      {message ? (
        <p className="max-w-64 text-xs text-muted-foreground">{message}</p>
      ) : null}
    </div>
  )
}
