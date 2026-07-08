import { NextRequest } from 'next/server'

import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const url = new URL('/api/auth/sign-in/email', request.url)

  return auth.handler(
    new Request(url, {
      method: 'POST',
      headers: request.headers,
      body: await request.text(),
    })
  )
}
