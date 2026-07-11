'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'

const currencies = [
  { code: 'USD', label: 'USD - US Dollar' },
  { code: 'INR', label: 'INR - Indian Rupee' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'GBP', label: 'GBP - British Pound' },
  { code: 'CAD', label: 'CAD - Canadian Dollar' },
  { code: 'AUD', label: 'AUD - Australian Dollar' },
  { code: 'SGD', label: 'SGD - Singapore Dollar' },
  { code: 'AED', label: 'AED - UAE Dirham' },
  { code: 'JPY', label: 'JPY - Japanese Yen' },
  { code: 'CHF', label: 'CHF - Swiss Franc' },
  { code: 'CNY', label: 'CNY - Chinese Yuan' },
  { code: 'HKD', label: 'HKD - Hong Kong Dollar' },
]

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinList(value: string[] | null | undefined) {
  return value?.join(', ') ?? ''
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function displaySalary(value: number | null | undefined) {
  return value && value > 0 ? value : ''
}

const fieldClass =
  'h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring'

const textareaClass =
  'min-h-24 w-full min-w-0 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

const labelClass = 'grid min-w-0 gap-2 text-sm font-medium'

export function ProfileSettings() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saved) return
    const timeout = window.setTimeout(() => setSaved(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [saved])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    updateProfile.mutate(
      {
        preferred_role: String(formData.get('preferred_role') || ''),
        skills: splitList(String(formData.get('skills') || '')),
        experience: String(formData.get('experience') || ''),
        preferred_locations: splitList(
          String(formData.get('preferred_locations') || '')
        ),
        salary_min: optionalNumber(formData.get('salary_min')),
        salary_max: optionalNumber(formData.get('salary_max')),
        salary_currency: String(formData.get('salary_currency') || 'USD'),
        work_preference: String(formData.get('work_preference') || ''),
        preferred_companies: splitList(
          String(formData.get('preferred_companies') || '')
        ),
      },
      {
        onSuccess: () => setSaved(true),
      }
    )
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border bg-background p-5 text-sm text-muted-foreground">
        Loading profile...
      </section>
    )
  }

  return (
    <section className="rounded-lg border bg-background p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These preferences will power job matching and draft generation.
        </p>
      </div>

      <form
        key={profile?.updated_at ?? profile?.id ?? 'new-profile'}
        className="grid gap-5"
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Preferred role
            <input
              className={fieldClass}
              name="preferred_role"
              defaultValue={profile?.preferred_role ?? ''}
              placeholder="Frontend Engineer"
            />
          </label>

          <label className={labelClass}>
            Work preference
            <select
              className={fieldClass}
              name="work_preference"
              defaultValue={profile?.work_preference ?? ''}
            >
              <option value="">No preference</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </label>
        </div>

        <label className={labelClass}>
          Skills
          <input
            className={fieldClass}
            name="skills"
            defaultValue={joinList(profile?.skills)}
            placeholder="React, Next.js, TypeScript"
          />
        </label>

        <label className={labelClass}>
          Experience
          <textarea
            className={textareaClass}
            name="experience"
            defaultValue={profile?.experience ?? ''}
            placeholder="Briefly describe your experience and target seniority."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className={labelClass}>
            Locations
            <input
              className={fieldClass}
              name="preferred_locations"
              defaultValue={joinList(profile?.preferred_locations)}
              placeholder="Bengaluru, Remote"
            />
          </label>

          <label className={labelClass}>
            Salary min
            <input
              className={fieldClass}
              min={0}
              name="salary_min"
              type="number"
              defaultValue={displaySalary(profile?.salary_min)}
            />
          </label>

          <label className={labelClass}>
            Salary max
            <input
              className={fieldClass}
              min={0}
              name="salary_max"
              type="number"
              defaultValue={displaySalary(profile?.salary_max)}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
          <label className={labelClass}>
            Preferred companies
            <input
              className={fieldClass}
              name="preferred_companies"
              defaultValue={joinList(profile?.preferred_companies)}
              placeholder="OpenAI, Vercel, Stripe"
            />
          </label>

          <label className={labelClass}>
            Currency
            <select
              className={fieldClass}
              name="salary_currency"
              defaultValue={profile?.salary_currency ?? 'USD'}
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save profile
          </Button>
          {saved ? (
            <p className="text-sm text-muted-foreground">Saved</p>
          ) : null}
        </div>
      </form>
    </section>
  )
}
