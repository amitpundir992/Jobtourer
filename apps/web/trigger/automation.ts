import { createHash } from 'node:crypto'
import { schedules, task } from '@trigger.dev/sdk'
import { prisma } from '@jobtourer/database'

import { runAutomationForUser } from '../src/lib/job-automation'

const queue = { concurrencyLimit: 2 }
const retry = {
  maxAttempts: 3,
  minTimeoutInMs: 5_000,
  maxTimeoutInMs: 60_000,
  factor: 2,
}

export const jobSearchAutomationRun = task({
  id: 'job-search-automation-run',
  queue,
  retry,
  run: async (payload: { userId: string; runId: string }) =>
    runAutomationForUser(payload.userId, payload.runId),
})

export const jobSearchAutomationSchedule = schedules.task({
  id: 'job-search-automation-schedule',
  queue,
  retry,
  run: async (payload) => {
    const userId = payload.externalId
    if (!userId) throw new Error('Scheduled automation requires a user ID')

    const preference = await prisma.automationPreference.findUnique({
      where: { user_id: userId },
      select: { enabled: true },
    })
    if (!preference?.enabled) return { skipped: 'automation-disabled' }

    const scheduledRunId = createHash('sha256')
      .update(`${payload.scheduleId}:${payload.timestamp.toISOString()}`)
      .digest('hex')
    const run = await prisma.automationRun.upsert({
      where: { id: scheduledRunId },
      update: {},
      create: {
        id: scheduledRunId,
        user_id: userId,
        trigger: 'scheduled',
      },
    })

    if (run.status === 'completed') return { skipped: 'already-completed' }
    return runAutomationForUser(userId, run.id)
  },
})
