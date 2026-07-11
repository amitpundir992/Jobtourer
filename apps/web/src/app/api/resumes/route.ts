import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@jobtourer/database'

import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resumes = await prisma.resume.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ resumes })
}
