import { schedules, tasks } from '@trigger.dev/sdk'

import type { jobSearchAutomationRun } from '../../trigger/automation'

export type ScheduleType = 'daily' | 'weekly' | 'monthly'

interface ScheduleInput {
  userId: string
  enabled: boolean
  scheduleType: ScheduleType
  weekDays: number[]
  monthDay: number
  scheduleHour: number
  timezone: string
  scheduleId?: string | null
}

function isNotFound(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status?: number }).status === 404
  )
}

export function automationCron(
  input: Omit<ScheduleInput, 'userId' | 'enabled'>
) {
  if (input.scheduleType === 'weekly') {
    return `0 ${input.scheduleHour} * * ${input.weekDays.join(',')}`
  }
  if (input.scheduleType === 'monthly') {
    return `0 ${input.scheduleHour} ${input.monthDay} * *`
  }
  return `0 ${input.scheduleHour} * * *`
}

export async function publishAutomationTask(input: {
  userId: string
  runId: string
}): Promise<{ id: string }> {
  return tasks.trigger<typeof jobSearchAutomationRun>(
    'job-search-automation-run',
    input,
    { idempotencyKey: input.runId }
  )
}

export async function syncAutomationSchedule(input: ScheduleInput) {
  if (!input.enabled) {
    if (input.scheduleId) {
      try {
        await schedules.deactivate(input.scheduleId)
      } catch (error) {
        if (!isNotFound(error)) throw error
      }
    }
    return { scheduleId: input.scheduleId ?? null, nextRunAt: null }
  }

  const options = {
    task: 'job-search-automation-schedule' as const,
    cron: automationCron(input),
    timezone: input.timezone,
    externalId: input.userId,
    deduplicationKey: `jobtourer-${process.env.NODE_ENV ?? 'development'}-${input.userId}`,
  }

  let schedule
  if (input.scheduleId) {
    try {
      schedule = await schedules.update(input.scheduleId, options)
      await schedules.activate(input.scheduleId)
    } catch (error) {
      if (!isNotFound(error)) throw error
      schedule = await schedules.create(options)
    }
  } else {
    schedule = await schedules.create(options)
  }

  return {
    scheduleId: schedule.id,
    nextRunAt: schedule.nextRun ? new Date(schedule.nextRun) : null,
  }
}
