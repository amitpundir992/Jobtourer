import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { recommendJobsForUser } from '@/lib/job-recommendations'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await recommendJobsForUser(user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Job recommendation error:', error)
    const message =
      error instanceof Error ? error.message : 'Could not find recommendations.'
    const status = message.startsWith('Complete your profile') ? 400 : 502

    return NextResponse.json({ error: message }, { status })
  }
}
