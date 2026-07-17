import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@jobtourer/database'

import { getCurrentUser } from '@/lib/auth'
import { downloadResumeObject } from '@/lib/supabase-resume-storage'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const resume = await prisma.resume.findFirst({
    where: { id, user_id: user.id },
  })
  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  }

  try {
    const file = await downloadResumeObject(resume.file_url)
    if (!file) {
      return NextResponse.redirect(new URL(resume.file_url, request.url))
    }

    const safeFileName = resume.file_name.replace(/["\r\n]/g, '_')
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': resume.file_type || 'application/octet-stream',
        'Content-Length': String(file.length),
        'Content-Disposition': `inline; filename="${safeFileName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Resume download error:', error)
    return NextResponse.json(
      { error: 'Resume could not be downloaded' },
      { status: 502 }
    )
  }
}
