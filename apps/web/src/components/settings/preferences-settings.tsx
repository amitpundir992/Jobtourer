'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Loader2, Play, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ScheduleType = 'daily' | 'weekly' | 'monthly'

interface AutomationData {
  preference: {
    enabled: boolean
    minimum_match: number
    create_email_drafts: boolean
    create_gmail_drafts: boolean
    schedule_type: ScheduleType
    week_days: number[]
    month_day: number
    schedule_hour: number
    timezone: string
    next_run_at: string | null
    last_run_at: string | null
  }
  gmail: { email: string } | null
  runs: Array<{
    id: string
    trigger: string
    status: string
    jobs_scanned: number
    matches_saved: number
    drafts_created: number
    gmail_drafts_created: number
    error: string | null
    created_at: string
  }>
}

const WEEK_DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const fieldClass =
  'h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring'

export function PreferencesSettings() {
  const [data, setData] = useState<AutomationData | null>(null)
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily')
  const [weekDays, setWeekDays] = useState<number[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadAutomation = useCallback(async () => {
    const response = await fetch('/api/automation', { cache: 'no-store' })
    const result = (await response.json()) as AutomationData & {
      error?: string
    }
    if (!response.ok)
      throw new Error(result.error || 'Could not load automation.')
    setData(result)
    return result
  }, [])

  useEffect(() => {
    loadAutomation()
      .then((result) => {
        setScheduleType(result.preference.schedule_type)
        setWeekDays(result.preference.week_days)
      })
      .catch((loadError: Error) => setError(loadError.message))
  }, [loadAutomation])

  useEffect(() => {
    if (
      !data?.runs.some((run) => ['queued', 'processing'].includes(run.status))
    ) {
      return
    }

    const timer = window.setInterval(() => {
      loadAutomation().catch((loadError: Error) => setError(loadError.message))
    }, 3_000)
    return () => window.clearInterval(timer)
  }, [data?.runs, loadAutomation])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!data) return

    const formData = new FormData(event.currentTarget)
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const response = await fetch('/api/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: formData.get('enabled') === 'on',
          minimum_match: Number(formData.get('minimum_match')) / 100,
          create_email_drafts: formData.get('create_email_drafts') === 'on',
          create_gmail_drafts: formData.get('create_gmail_drafts') === 'on',
          schedule_type: scheduleType,
          week_days: weekDays,
          month_day: Number(formData.get('month_day')),
          schedule_hour: Number(formData.get('schedule_hour')),
          timezone: String(formData.get('timezone')),
        }),
      })
      const result = (await response.json()) as {
        preference?: AutomationData['preference']
        error?: string
      }
      if (!response.ok || !result.preference) {
        throw new Error(result.error || 'Could not save automation settings.')
      }

      setData({ ...data, preference: result.preference })
      setScheduleType(result.preference.schedule_type)
      setWeekDays(result.preference.week_days)
      setSaved(true)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save settings.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function runNow() {
    if (!data) return
    setRunning(true)
    setError('')
    try {
      const response = await fetch('/api/automation', { method: 'POST' })
      const result = (await response.json()) as {
        run?: AutomationData['runs'][number]
        error?: string
      }
      if (!response.ok || !result.run) {
        throw new Error(result.error || 'Could not queue automation.')
      }
      setData({ ...data, runs: [result.run, ...data.runs].slice(0, 5) })
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : 'Could not queue automation.'
      )
    } finally {
      setRunning(false)
    }
  }

  function toggleWeekday(day: number) {
    setWeekDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day]
    )
  }

  if (!data && !error) {
    return (
      <section className="rounded-lg border bg-background p-5 text-sm text-muted-foreground">
        Loading automation settings...
      </section>
    )
  }

  return (
    <section className="rounded-lg border bg-background p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold">Job search automation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Schedule job matching and draft preparation with Trigger.dev.
        </p>
      </div>

      {data ? (
        <form className="grid gap-5" onSubmit={onSubmit}>
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              name="enabled"
              type="checkbox"
              defaultChecked={data.preference.enabled}
              className="h-4 w-4"
            />
            Enable scheduled automation
          </label>

          <div className="max-w-lg">
            <span className="mb-2 block text-sm font-medium">Frequency</span>
            <div className="grid grid-cols-3 gap-1 rounded-md border bg-muted/40 p-1">
              {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={scheduleType === type}
                  className={`h-9 rounded px-3 text-sm font-medium capitalize transition-colors ${
                    scheduleType === type
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setScheduleType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {scheduleType === 'weekly' ? (
            <div>
              <span className="mb-2 block text-sm font-medium">Run on</span>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => {
                  const selected = weekDays.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={selected}
                      className={`h-10 w-12 rounded-md border text-sm font-medium transition-colors ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted'
                      }`}
                      onClick={() => toggleWeekday(day.value)}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            {scheduleType === 'monthly' ? (
              <label className="grid gap-2 text-sm font-medium">
                Day of month
                <select
                  name="month_day"
                  defaultValue={data.preference.month_day}
                  className={fieldClass}
                >
                  {Array.from({ length: 28 }, (_, index) => index + 1).map(
                    (day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    )
                  )}
                </select>
              </label>
            ) : (
              <input type="hidden" name="month_day" value={1} />
            )}

            <label className="grid gap-2 text-sm font-medium">
              Run hour
              <select
                name="schedule_hour"
                defaultValue={data.preference.schedule_hour}
                className={fieldClass}
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>
                    {new Intl.DateTimeFormat('en-US', {
                      hour: 'numeric',
                      hour12: true,
                      timeZone: 'UTC',
                    }).format(new Date(Date.UTC(2020, 0, 1, hour)))}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Timezone
              <select
                name="timezone"
                defaultValue={data.preference.timezone}
                className={fieldClass}
              >
                {!TIMEZONES.includes(data.preference.timezone) ? (
                  <option value={data.preference.timezone}>
                    {data.preference.timezone}
                  </option>
                ) : null}
                {TIMEZONES.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Minimum match
              <select
                name="minimum_match"
                defaultValue={Math.round(data.preference.minimum_match * 100)}
                className={fieldClass}
              >
                <option value="60">60%</option>
                <option value="70">70%</option>
                <option value="75">75%</option>
                <option value="80">80%</option>
                <option value="90">90%</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                name="create_email_drafts"
                type="checkbox"
                defaultChecked={data.preference.create_email_drafts}
                className="h-4 w-4"
              />
              Create internal email drafts
            </label>
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                name="create_gmail_drafts"
                type="checkbox"
                defaultChecked={data.preference.create_gmail_drafts}
                disabled={!data.gmail}
                className="h-4 w-4"
              />
              Create Gmail drafts when an email is available
            </label>
          </div>

          {data.preference.next_run_at ? (
            <p className="text-sm text-muted-foreground">
              Next run: {new Date(data.preference.next_run_at).toLocaleString()}
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save automation
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={running || !data.preference.enabled}
              onClick={runNow}
            >
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run now
            </Button>
            {saved ? (
              <span className="text-sm text-emerald-600">Saved</span>
            ) : null}
          </div>
        </form>
      ) : (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {data?.runs.length ? (
        <div className="mt-7 border-t pt-5">
          <h3 className="text-sm font-semibold">Recent runs</h3>
          <div className="mt-3 divide-y text-sm">
            {data.runs.map((run) => (
              <div
                key={run.id}
                className="grid gap-1 py-3 sm:grid-cols-[160px_1fr_auto] sm:items-center"
              >
                <span>{new Date(run.created_at).toLocaleString()}</span>
                <span className="text-muted-foreground">
                  {run.jobs_scanned} scanned, {run.matches_saved} matches,{' '}
                  {run.drafts_created} drafts
                  {run.error ? ` - ${run.error}` : ''}
                </span>
                <span className="capitalize">{run.status}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
