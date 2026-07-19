import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@jobtourer/database'

import { getCurrentUser } from '@/lib/auth'

const GMAIL_COMPOSE_SCOPE = 'https://www.googleapis.com/auth/gmail.compose'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.GMAIL_CLIENT_ID
  const redirectUri = process.env.GMAIL_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Gmail OAuth is not configured.' },
      { status: 503 }
    )
  }

  const state = randomBytes(32).toString('base64url')
  await prisma.verification.create({
    data: {
      identifier: `gmail-oauth-state:${state}`,
      value: user.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  const authorizationUrl = new URL(
    'https://accounts.google.com/o/oauth2/v2/auth'
  )
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: `openid email ${GMAIL_COMPOSE_SCOPE}`,
    state,
  }).toString()

  return NextResponse.redirect(authorizationUrl)
}
