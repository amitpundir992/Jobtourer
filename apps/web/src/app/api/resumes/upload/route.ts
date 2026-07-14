import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { Prisma, prisma } from '@jobtourer/database'

import { getCurrentUser } from '@/lib/auth'
import { parseResume } from '@/lib/resume-parser'

const allowedTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const extensionByType: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Resume file is required' },
      { status: 400 }
    )
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { error: 'Only PDF and DOCX resumes are supported' },
      { status: 400 }
    )
  }

  const publicDir = path.join(process.cwd(), 'public', 'resumes')
  await mkdir(publicDir, { recursive: true })

  const extension = extensionByType[file.type]
  const safeUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `${safeUserId}-resume${extension}`
  const filePath = path.join(publicDir, fileName)
  const fileUrl = `/resumes/${fileName}`

  const existingResume = await prisma.resume.findFirst({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
  })

  if (existingResume?.file_url && existingResume.file_url !== fileUrl) {
    const previousPath = path.join(
      process.cwd(),
      'public',
      existingResume.file_url.replace(/^\//, '')
    )

    if (previousPath.startsWith(publicDir)) {
      await unlink(previousPath).catch(() => undefined)
    }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filePath, buffer)

  const parsedData = await parseResume(buffer, file.type).catch((error) => {
    console.error('Resume parse error:', error)
    return {
      parse_status: 'failed' as const,
      parse_error:
        error instanceof Error ? error.message : 'Resume parsing failed',
      skills: [],
      experience: [],
      education: [],
      projects: [],
    }
  })
  const parsedJson = parsedData as Prisma.InputJsonValue

  const resume = await prisma.resume.upsert({
    where: { id: existingResume?.id ?? '' },
    update: {
      title: 'Primary Resume',
      file_url: fileUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      is_default: true,
      parsed_data: parsedJson,
    },
    create: {
      user_id: user.id,
      title: 'Primary Resume',
      file_url: fileUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      is_default: true,
      parsed_data: parsedJson,
    },
  })

  if (parsedData.parse_status === 'parsed') {
    const profile = await prisma.profile.findUnique({
      where: { user_id: user.id },
    })

    await prisma.profile.upsert({
      where: { user_id: user.id },
      update: {
        skills:
          profile && profile.skills.length > 0
            ? undefined
            : (parsedData.skills ?? []),
        experience: profile?.experience
          ? undefined
          : (parsedData.summary ?? parsedData.experience?.[0]?.description),
      },
      create: {
        user_id: user.id,
        skills: parsedData.skills ?? [],
        experience:
          parsedData.summary ?? parsedData.experience?.[0]?.description,
      },
    })
  }

  revalidateTag('resume-data')
  return NextResponse.json({ resume, parsed_data: parsedData })
}
