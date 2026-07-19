import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getJobRecommendations, parseJobQuery } from '@/lib/job-query'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query = parseJobQuery(
      Object.fromEntries(new URL(request.url).searchParams)
    )
    const result = await getJobRecommendations(user.id, query)

    return NextResponse.json({
      recommendations: result.recommendations,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Get jobs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
