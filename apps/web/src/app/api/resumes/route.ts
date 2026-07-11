import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { NextRequest, NextResponse } from 'next/server'
import { Prisma, prisma, type Resume } from '@jobtourer/database'

import { getCurrentUser } from '@/lib/auth'
import { parseResume } from '@/lib/resume-parser'

function hasUsefulParsedData(parsedData: unknown) {
  if (!parsedData || typeof parsedData !== 'object') return false

  const data = parsedData as {
    parse_status?: string
    raw_text?: string
    skills?: string[]
    summary?: string
    experience?: unknown[]
    projects?: unknown[]
  }

  return Boolean(
    data.parse_status === 'parsed' &&
    (data.raw_text?.trim() ||
      data.summary?.trim() ||
      data.skills?.length ||
      data.experience?.length ||
      data.projects?.length)
  )
}

function getLocalResumePath(fileUrl: string) {
  const publicDir = path.resolve(process.cwd(), 'public')
  const resumePath = path.resolve(publicDir, fileUrl.replace(/^\//, ''))

  if (!resumePath.startsWith(publicDir)) {
    throw new Error('Invalid resume path')
  }

  return resumePath
}

async function ensureResumeParsed(resume: Resume) {
  if (hasUsefulParsedData(resume.parsed_data)) {
    return resume
  }

  try {
    const filePath = getLocalResumePath(resume.file_url)
    const buffer = await readFile(filePath)
    const parsedData = await parseResume(buffer, resume.file_type)

    return prisma.resume.update({
      where: { id: resume.id },
      data: {
        parsed_data: parsedData as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    const parsedData = {
      parse_status: 'failed' as const,
      parse_error:
        error instanceof Error ? error.message : 'Resume parsing failed',
      skills: [],
      experience: [],
      education: [],
      projects: [],
    }

    return prisma.resume.update({
      where: { id: resume.id },
      data: {
        parsed_data: parsedData as Prisma.InputJsonValue,
      },
    })
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resumes = await prisma.resume.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
  })

  const parsedResumes = await Promise.all(resumes.map(ensureResumeParsed))

  return NextResponse.json({ resumes: parsedResumes })
}
