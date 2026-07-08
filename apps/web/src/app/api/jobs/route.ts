import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@jobtourer/database'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const jobFiltersSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  experience_level: z.string().optional(),
  job_type: z.string().optional(),
  limit: z.coerce.number().default(20),
  offset: z.coerce.number().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = jobFiltersSchema.parse(Object.fromEntries(searchParams))

    const where: any = {
      status: 'active',
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' }
    }

    if (filters.salary_min) {
      where.salary_min = { gte: filters.salary_min }
    }

    if (filters.salary_max) {
      where.salary_max = { lte: filters.salary_max }
    }

    if (filters.experience_level) {
      where.experience_level = filters.experience_level
    }

    if (filters.job_type) {
      where.job_type = filters.job_type
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        take: filters.limit,
        skip: filters.offset,
        orderBy: { created_at: 'desc' },
        include: {
          saved_jobs: {
            where: { user_id: user.id },
            select: { id: true, match_score: true },
          },
        },
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      jobs: jobs.map((job: any) => ({
        ...job,
        is_saved: job.saved_jobs.length > 0,
        match_score: job.saved_jobs[0]?.match_score || null,
        saved_jobs: undefined,
      })),
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        has_more: filters.offset + filters.limit < total,
      },
    })
  } catch (error) {
    console.error('Get jobs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
