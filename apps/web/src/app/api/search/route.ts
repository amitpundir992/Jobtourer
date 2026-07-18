import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@jobtourer/database'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'

const searchSchema = z.object({
  q: z.string().trim().min(2).max(100),
})

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = searchSchema.safeParse({
    q: new URL(request.url).searchParams.get('q'),
  })
  if (!parsed.success) {
    return NextResponse.json({ results: [] })
  }

  const jobSearch = {
    OR: [
      { title: { contains: parsed.data.q, mode: 'insensitive' as const } },
      { company: { contains: parsed.data.q, mode: 'insensitive' as const } },
      { location: { contains: parsed.data.q, mode: 'insensitive' as const } },
    ],
  }

  const [savedJobs, applications] = await Promise.all([
    prisma.savedJob.findMany({
      where: {
        user_id: user.id,
        job: { status: 'active', ...jobSearch },
      },
      select: {
        match_score: true,
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 6,
    }),
    prisma.application.findMany({
      where: { user_id: user.id, job: jobSearch },
      select: {
        id: true,
        status: true,
        job: { select: { title: true, company: true } },
      },
      orderBy: { updated_at: 'desc' },
      take: 4,
    }),
  ])

  return NextResponse.json({
    results: [
      ...savedJobs.map((savedJob) => ({
        id: savedJob.job.id,
        type: 'job' as const,
        title: savedJob.job.title,
        subtitle: [savedJob.job.company, savedJob.job.location]
          .filter(Boolean)
          .join(' - '),
        meta:
          savedJob.match_score === null
            ? null
            : `${Math.round(savedJob.match_score * 100)}% match`,
        href: `/jobs?search=${encodeURIComponent(savedJob.job.title)}`,
      })),
      ...applications.map((application) => ({
        id: application.id,
        type: 'application' as const,
        title: application.job.title,
        subtitle: application.job.company,
        meta: application.status,
        href: `/applications?search=${encodeURIComponent(application.job.title)}`,
      })),
    ],
  })
}
