import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'jobtourer-web',
    timestamp: new Date().toISOString(),
  })
}
