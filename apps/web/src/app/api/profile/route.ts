import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@jobtourer/database'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { ensureProfile } from '@/lib/profile'

const profileSchema = z.object({
  preferred_role: z.string().trim().nullable().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().trim().nullable().optional(),
  preferred_locations: z.array(z.string()).optional(),
  salary_min: z.number().int().nonnegative().nullable().optional(),
  salary_max: z.number().int().nonnegative().nullable().optional(),
  salary_currency: z.string().trim().default('USD').optional(),
  work_preference: z.string().trim().nullable().optional(),
  preferred_companies: z.array(z.string()).optional(),
})

function cleanText(value: string | null | undefined) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

function cleanList(value: string[] | undefined) {
  return value?.map((item) => item.trim()).filter(Boolean)
}

function cleanSalary(value: number | null | undefined) {
  return value && value > 0 ? value : null
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await ensureProfile(user.id)
  return NextResponse.json({ profile })
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureProfile(user.id)
  const input = profileSchema.parse(await request.json())
  const profile = await prisma.profile.update({
    where: { user_id: user.id },
    data: {
      preferred_role: cleanText(input.preferred_role),
      skills: cleanList(input.skills),
      experience: cleanText(input.experience),
      preferred_locations: cleanList(input.preferred_locations),
      salary_min: cleanSalary(input.salary_min),
      salary_max: cleanSalary(input.salary_max),
      salary_currency: input.salary_currency || 'USD',
      work_preference: cleanText(input.work_preference),
      preferred_companies: cleanList(input.preferred_companies),
    },
  })

  return NextResponse.json({ profile })
}
