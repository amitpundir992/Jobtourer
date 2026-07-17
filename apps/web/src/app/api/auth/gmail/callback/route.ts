import { NextRequest, NextResponse } from 'next/server'
import { encryptToken } from '@jobtourer/config'
import { prisma } from '@jobtourer/database'

interface GoogleTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
}

interface GoogleUserInfo {
  email?: string
}

function settingsRedirect(request: NextRequest, result: string) {
  return NextResponse.redirect(
    new URL(`/settings?tab=integrations&gmail=${result}`, request.url)
  )
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  if (!code || !state || request.nextUrl.searchParams.has('error')) {
    return settingsRedirect(request, 'denied')
  }

  const verification = await prisma.verification.findFirst({
    where: {
      identifier: `gmail-oauth-state:${state}`,
      expiresAt: { gt: new Date() },
    },
  })
  if (!verification) {
    return settingsRedirect(request, 'invalid-state')
  }

  await prisma.verification.delete({ where: { id: verification.id } })

  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const redirectUri = process.env.GMAIL_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    return settingsRedirect(request, 'not-configured')
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    })
    const tokens = (await tokenResponse.json()) as GoogleTokenResponse
    if (!tokenResponse.ok || !tokens.access_token) {
      throw new Error(tokens.error || 'Google did not return an access token')
    }

    const userInfoResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        cache: 'no-store',
      }
    )
    const userInfo = (await userInfoResponse.json()) as GoogleUserInfo
    if (!userInfoResponse.ok || !userInfo.email) {
      throw new Error('Could not read the connected Gmail address')
    }

    const existing = await prisma.gmailConnection.findUnique({
      where: { user_id: verification.value },
    })
    await prisma.gmailConnection.upsert({
      where: { user_id: verification.value },
      update: {
        email: userInfo.email,
        encrypted_access_token: encryptToken(tokens.access_token),
        encrypted_refresh_token: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : existing?.encrypted_refresh_token,
        access_token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope,
      },
      create: {
        user_id: verification.value,
        email: userInfo.email,
        encrypted_access_token: encryptToken(tokens.access_token),
        encrypted_refresh_token: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : null,
        access_token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope,
      },
    })

    return settingsRedirect(request, 'connected')
  } catch (error) {
    console.error('Gmail OAuth callback failed:', error)
    return settingsRedirect(request, 'failed')
  }
}
