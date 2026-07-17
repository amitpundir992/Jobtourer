import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@jobtourer/database'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import {
  publishAutomationTask,
  syncAutomationSchedule,
} from '@/lib/automation-delivery'

const automationSchema = z
  .object({
    enabled: z.boolean(),
    minimum_match: z.number().min(0.5).max(1),
    create_email_drafts: z.boolean(),
    create_gmail_drafts: z.boolean(),
    schedule_type: z.enum(['daily', 'weekly', 'monthly']),
    week_days: z.array(z.number().int().min(0).max(6)).max(7),
    month_day: z.number().int().min(1).max(28),
    schedule_hour: z.number().int().min(0).max(23),
    timezone: z.string().trim().min(1).max(100),
  })
  .superRefine((input, context) => {
    if (input.schedule_type === 'weekly' && input.week_days.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['week_days'],
        message: 'Select at least one weekday.',
      })
    }
  })

function validTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone }).format()
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [preference, gmail, runs] = await Promise.all([
    prisma.automationPreference.findUnique({ where: { user_id: user.id } }),
    prisma.gmailConnection.findUnique({
      where: { user_id: user.id },
      select: { email: true, updated_at: true },
    }),
    prisma.automationRun.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
  ])

  return NextResponse.json({
    preference: preference ?? {
      enabled: false,
      minimum_match: 0.7,
      create_email_drafts: true,
      create_gmail_drafts: false,
      schedule_type: 'daily',
      week_days: [],
      month_day: 1,
      schedule_hour: 8,
      timezone: 'Asia/Kolkata',
      trigger_schedule_id: null,
      next_run_at: null,
      last_run_at: null,
    },
    gmail,
    runs,
  })
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const input = automationSchema.parse(await request.json())
  const weekDays = [...new Set(input.week_days)].sort((a, b) => a - b)
  if (!validTimezone(input.timezone)) {
    return NextResponse.json({ error: 'Invalid timezone.' }, { status: 400 })
  }

  const gmail = input.create_gmail_drafts
    ? await prisma.gmailConnection.findUnique({ where: { user_id: user.id } })
    : null
  if (input.create_gmail_drafts && !gmail) {
    return NextResponse.json(
      { error: 'Connect Gmail before enabling Gmail drafts.' },
      { status: 400 }
    )
  }

  const existing = await prisma.automationPreference.findUnique({
    where: { user_id: user.id },
  })
  let triggerSchedule
  try {
    triggerSchedule = await syncAutomationSchedule({
      userId: user.id,
      enabled: input.enabled,
      scheduleType: input.schedule_type,
      weekDays,
      monthDay: input.month_day,
      scheduleHour: input.schedule_hour,
      timezone: input.timezone,
      scheduleId: existing?.trigger_schedule_id,
    })
  } catch (error) {
    console.error('Failed to sync Trigger.dev schedule', error)
    return NextResponse.json(
      {
        error:
          'Could not sync the Trigger.dev schedule. Start Trigger.dev locally or deploy the tasks first.',
      },
      { status: 503 }
    )
  }

  const preference = await prisma.automationPreference.upsert({
    where: { user_id: user.id },
    update: {
      ...input,
      week_days: weekDays,
      trigger_schedule_id: triggerSchedule.scheduleId,
      next_run_at: triggerSchedule.nextRunAt,
    },
    create: {
      user_id: user.id,
      ...input,
      week_days: weekDays,
      trigger_schedule_id: triggerSchedule.scheduleId,
      next_run_at: triggerSchedule.nextRunAt,
    },
  })

  return NextResponse.json({ preference })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [preference, profile, resume] = await Promise.all([
    prisma.automationPreference.findUnique({ where: { user_id: user.id } }),
    prisma.profile.findUnique({ where: { user_id: user.id } }),
    prisma.resume.findFirst({
      where: { user_id: user.id, is_default: true },
    }),
  ])
  if (!preference?.enabled) {
    return NextResponse.json(
      { error: 'Enable and save automation before running it.' },
      { status: 400 }
    )
  }
  if (!profile?.preferred_role || !resume?.parsed_data) {
    return NextResponse.json(
      { error: 'A completed profile and parsed default resume are required.' },
      { status: 400 }
    )
  }

  const run = await prisma.automationRun.create({
    data: { user_id: user.id, trigger: 'manual' },
  })
  try {
    await publishAutomationTask({ userId: user.id, runId: run.id })
  } catch (error) {
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completed_at: new Date(),
      },
    })
    return NextResponse.json(
      { error: 'Could not queue the automation run.' },
      { status: 503 }
    )
  }

  return NextResponse.json({ run }, { status: 202 })
}
