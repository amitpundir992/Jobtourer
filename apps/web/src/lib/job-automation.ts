import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { decryptToken, encryptToken } from '@jobtourer/config'
import { prisma } from '@jobtourer/database'
import type { ParsedResumeData } from '@jobtourer/types'

import { recommendJobsForUser } from '@/lib/job-recommendations'
import { downloadResumeObject } from '@/lib/supabase-resume-storage'

const MAX_DRAFTS_PER_RUN = 10

function fallbackDraft(
  name: string,
  job: { title: string; company: string },
  resume: ParsedResumeData
) {
  const skills = (resume.skills ?? []).slice(0, 4).join(', ')
  return {
    subject: `Application for ${job.title}`,
    body: [
      'Hello Hiring Team,',
      '',
      `I am writing to express my interest in the ${job.title} position at ${job.company}.`,
      skills
        ? `My experience with ${skills} aligns well with the role's requirements.`
        : 'My background and project experience align well with the role requirements.',
      '',
      'I have attached my resume for your review and would welcome the opportunity to discuss how I can contribute to your team.',
      '',
      'Regards,',
      name,
    ].join('\n'),
  }
}

async function aiDraft(prompt: string) {
  const provider = process.env.AI_PROVIDER || 'openai'
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    })
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`)
    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return result.choices?.[0]?.message?.content ?? ''
  }

  if (provider === 'gemini' && process.env.GOOGLE_GEMINI_API_KEY) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(process.env.GOOGLE_GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    )
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`)
    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    return result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  if (provider === 'claude' && process.env.ANTHROPIC_API_KEY) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) throw new Error(`Anthropic returned ${response.status}`)
    const result = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>
    }
    return result.content?.find((item) => item.type === 'text')?.text ?? ''
  }

  throw new Error(`AI provider ${provider} is not configured`)
}

async function draftContent(input: {
  name: string
  job: {
    title: string
    company: string
    description: string
    location: string | null
  }
  resume: ParsedResumeData
}) {
  const fallback = fallbackDraft(input.name, input.job, input.resume)
  try {
    const response = await aiDraft(`
Return JSON with "subject" and "body" for a concise, truthful job application email.
Never invent experience, achievements, recruiter names, or contact details.
Candidate: ${input.name}
Role: ${input.job.title}
Company: ${input.job.company}
Location: ${input.job.location || 'Not specified'}
Description: ${input.job.description.slice(0, 4000)}
Resume skills: ${(input.resume.skills ?? []).join(', ')}
Resume experience: ${JSON.stringify((input.resume.experience ?? []).slice(0, 3))}
The body must use three short paragraphs, mention the attached resume, and end with the candidate name.
`)
    const match = response.match(/\{[\s\S]*\}/)
    if (!match) return fallback
    const parsed = JSON.parse(match[0]) as { subject?: string; body?: string }
    return parsed.subject?.trim() && parsed.body?.trim()
      ? {
          subject: parsed.subject.trim().slice(0, 160),
          body: parsed.body.trim(),
        }
      : fallback
  } catch (error) {
    console.warn('AI draft generation failed; using template:', error)
    return fallback
  }
}

function localResumePath(fileUrl: string) {
  const relative = fileUrl.replace(/^[/\\]+/, '')
  const roots = [
    process.env.RESUME_PUBLIC_DIR,
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), 'apps/web/public'),
  ].filter((root): root is string => Boolean(root))

  for (const root of roots) {
    const base = path.resolve(root)
    const candidate = path.resolve(base, relative)
    if (candidate.startsWith(`${base}${path.sep}`) && existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

async function resumeFile(fileUrl: string) {
  const storedFile = await downloadResumeObject(fileUrl)
  if (storedFile) return storedFile

  const localPath = localResumePath(fileUrl)
  if (localPath) return readFileSync(localPath)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) throw new Error(`Resume file is unavailable at ${fileUrl}`)

  const response = await fetch(new URL(fileUrl, appUrl), { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Resume download returned ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

function encodeMime(input: {
  from: string
  to: string
  subject: string
  body: string
  fileName: string
  fileType: string
  file: Buffer
}) {
  const boundary = `jobtourer-${crypto.randomUUID()}`
  const attachment =
    input.file
      .toString('base64')
      .match(/.{1,76}/g)
      ?.join('\r\n') ?? ''
  return Buffer.from(
    [
      `From: ${input.from}`,
      `To: ${input.to}`,
      `Subject: ${input.subject.replace(/[\r\n]+/g, ' ')}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      input.body,
      '',
      `--${boundary}`,
      `Content-Type: ${input.fileType || 'application/octet-stream'}; name="${input.fileName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${input.fileName}"`,
      '',
      attachment,
      `--${boundary}--`,
    ].join('\r\n')
  ).toString('base64url')
}

async function gmailAccessToken(userId: string) {
  const connection = await prisma.gmailConnection.findUnique({
    where: { user_id: userId },
  })
  if (!connection?.encrypted_refresh_token) {
    throw new Error('Gmail is not connected with offline access')
  }
  if (
    connection.encrypted_access_token &&
    connection.access_token_expires_at &&
    connection.access_token_expires_at.getTime() > Date.now() + 60_000
  ) {
    return {
      token: decryptToken(connection.encrypted_access_token),
      connection,
    }
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID ?? '',
      client_secret: process.env.GMAIL_CLIENT_SECRET ?? '',
      refresh_token: decryptToken(connection.encrypted_refresh_token),
      grant_type: 'refresh_token',
    }),
  })
  const tokens = (await response.json()) as {
    access_token?: string
    expires_in?: number
    error?: string
  }
  if (!response.ok || !tokens.access_token) {
    throw new Error(tokens.error || 'Could not refresh Gmail access')
  }
  await prisma.gmailConnection.update({
    where: { user_id: userId },
    data: {
      encrypted_access_token: encryptToken(tokens.access_token),
      access_token_expires_at: new Date(
        Date.now() + (tokens.expires_in ?? 3600) * 1000
      ),
    },
  })
  return { token: tokens.access_token, connection }
}

async function syncGmailDraft(input: {
  userId: string
  draftId: string
  recipient: string
  subject: string
  body: string
  resume: { file_url: string; file_name: string; file_type: string }
}) {
  const { token, connection } = await gmailAccessToken(input.userId)
  const file = await resumeFile(input.resume.file_url)
  const raw = encodeMime({
    from: connection.email,
    to: input.recipient,
    subject: input.subject,
    body: input.body,
    fileName: input.resume.file_name,
    fileType: input.resume.file_type,
    file,
  })
  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { raw } }),
    }
  )
  const result = (await response.json()) as {
    id?: string
    error?: { message?: string }
  }
  if (!response.ok || !result.id) {
    throw new Error(result.error?.message || 'Gmail did not create the draft')
  }
  await prisma.emailDraft.update({
    where: { id: input.draftId },
    data: { gmail_draft_id: result.id, gmail_error: null },
  })
}

export async function runAutomationForUser(userId: string, runId: string) {
  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: 'processing', started_at: new Date(), error: null },
  })

  try {
    const [preference, user, resume] = await Promise.all([
      prisma.automationPreference.findUnique({ where: { user_id: userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.resume.findFirst({
        where: { user_id: userId, is_default: true },
        orderBy: { updated_at: 'desc' },
      }),
    ])
    if (!preference?.enabled || !user || !resume?.parsed_data) {
      throw new Error(
        'Automation requires enabled settings and a parsed resume'
      )
    }

    const recommendations = await recommendJobsForUser(userId, {
      minimumMatch: preference.minimum_match,
      maxRecommendations: 100,
    })
    const parsedResume = resume.parsed_data as unknown as ParsedResumeData
    let draftsCreated = 0
    let gmailDraftsCreated = 0

    if (preference.create_email_drafts) {
      for (const recommendation of recommendations.savedRecommendations.slice(
        0,
        MAX_DRAFTS_PER_RUN
      )) {
        const existing = await prisma.emailDraft.findFirst({
          where: { user_id: userId, job_id: recommendation.jobId },
        })
        if (existing) continue

        const job = await prisma.job.findUnique({
          where: { id: recommendation.jobId },
        })
        if (!job) continue
        const content = await draftContent({
          name: user.name,
          job,
          resume: parsedResume,
        })
        const draft = await prisma.emailDraft.create({
          data: {
            user_id: userId,
            job_id: job.id,
            resume_id: resume.id,
            recipient_email: job.recipient_email,
            subject: content.subject,
            body: content.body,
          },
        })
        const application = await prisma.application.findFirst({
          where: { user_id: userId, job_id: job.id },
        })
        if (application) {
          await prisma.application.update({
            where: { id: application.id },
            data: { email_draft_id: draft.id, resume_id: resume.id },
          })
        } else {
          await prisma.application.create({
            data: {
              user_id: userId,
              job_id: job.id,
              resume_id: resume.id,
              email_draft_id: draft.id,
            },
          })
        }
        draftsCreated += 1

        if (preference.create_gmail_drafts && job.recipient_email) {
          try {
            await syncGmailDraft({
              userId,
              draftId: draft.id,
              recipient: job.recipient_email,
              subject: draft.subject,
              body: draft.body,
              resume,
            })
            gmailDraftsCreated += 1
          } catch (error) {
            await prisma.emailDraft.update({
              where: { id: draft.id },
              data: {
                gmail_error:
                  error instanceof Error ? error.message : String(error),
              },
            })
          }
        }
      }
    }

    await prisma.$transaction([
      prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          jobs_scanned: recommendations.jobsScanned,
          matches_saved: recommendations.recommendationsSaved,
          drafts_created: draftsCreated,
          gmail_drafts_created: gmailDraftsCreated,
          source_counts: recommendations.sources,
          completed_at: new Date(),
        },
      }),
      prisma.automationPreference.update({
        where: { user_id: userId },
        data: { last_run_at: new Date() },
      }),
    ])
    return {
      jobsScanned: recommendations.jobsScanned,
      matchesSaved: recommendations.recommendationsSaved,
      draftsCreated,
      gmailDraftsCreated,
    }
  } catch (error) {
    await prisma.automationRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completed_at: new Date(),
      },
    })
    throw error
  }
}
