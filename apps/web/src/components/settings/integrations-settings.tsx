'use client'

import { useEffect, useState } from 'react'
import { Link2, Loader2, Unplug } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function IntegrationsSettings() {
  const [gmail, setGmail] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/automation')
      .then(async (response) => {
        const result = (await response.json()) as {
          gmail: { email: string } | null
          error?: string
        }
        if (!response.ok)
          throw new Error(result.error || 'Could not load Gmail status.')
        setGmail(result.gmail)
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  async function disconnect() {
    setDisconnecting(true)
    setError('')
    try {
      const response = await fetch('/api/integrations/gmail', {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Could not disconnect Gmail.')
      setGmail(null)
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : 'Could not disconnect Gmail.'
      )
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <section className="rounded-lg border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Gmail</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create reviewable drafts with your selected resume attached.
          </p>
          {gmail ? (
            <p className="mt-3 text-sm">Connected as {gmail.email}</p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : gmail ? (
          <Button
            type="button"
            variant="outline"
            disabled={disconnecting}
            onClick={disconnect}
          >
            {disconnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Unplug className="mr-2 h-4 w-4" />
            )}
            Disconnect
          </Button>
        ) : (
          <Button asChild>
            <a href="/api/integrations/gmail/connect">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Gmail
            </a>
          </Button>
        )}
      </div>
    </section>
  )
}
