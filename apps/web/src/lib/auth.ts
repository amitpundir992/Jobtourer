import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@jobtourer/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

interface JwtPayload {
  userId: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export async function getCurrentUser(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        created_at: true,
      },
    })

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
