import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@jobtourer/database'

import { getCurrentUser } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.$transaction([
    prisma.gmailConnection.deleteMany({ where: { user_id: user.id } }),
    prisma.automationPreference.updateMany({
      where: { user_id: user.id },
      data: { create_gmail_drafts: false },
    }),
  ])

  return NextResponse.json({ connected: false })
}
