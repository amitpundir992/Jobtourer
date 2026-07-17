import { prisma } from '@jobtourer/database'
import type { ParsedResumeData } from '@jobtourer/types'
import { logger } from '../lib/logger'
import { generateText } from '../lib/ai'

interface GenerateEmailInput {
  userId: string
  jobId: string
  resumeId: string
  tone?: 'professional' | 'casual' | 'enthusiastic'
}

interface EmailOutput {
  id: string
  subject: string
  body: string
  recipientEmail: string | null
}

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

export async function generateEmailDraft(
  input: GenerateEmailInput
): Promise<EmailOutput> {
  const { userId, jobId, resumeId, tone = 'professional' } = input
  const existing = await prisma.emailDraft.findFirst({
    where: { user_id: userId, job_id: jobId },
  })
  if (existing) {
    return {
      id: existing.id,
      subject: existing.subject,
      body: existing.body,
      recipientEmail: existing.recipient_email,
    }
  }

  const [user, job, resume] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.resume.findFirst({ where: { id: resumeId, user_id: userId } }),
  ])
  if (!user || !job || !resume?.parsed_data) {
    throw new Error('User, job, or parsed resume is missing')
  }

  const resumeData = resume.parsed_data as unknown as ParsedResumeData
  let generated = fallbackDraft(user.name, job, resumeData)
  try {
    const response = await generateText(`
Write a concise, truthful job application email as JSON with "subject" and "body".
Do not invent experience, achievements, recruiter names, or contact details.

Candidate: ${user.name}
Role: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}
Job description: ${job.description.slice(0, 4000)}
Resume skills: ${(resumeData.skills ?? []).join(', ')}
Resume experience: ${JSON.stringify((resumeData.experience ?? []).slice(0, 3))}
Tone: ${tone}

The body must be 3 short paragraphs, mention the attached resume, and end with the candidate name.
`)
    const match = response.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0]) as { subject?: string; body?: string }
      if (parsed.subject?.trim() && parsed.body?.trim()) {
        generated = {
          subject: parsed.subject.trim().slice(0, 160),
          body: parsed.body.trim(),
        }
      }
    }
  } catch (error) {
    logger.warn(`AI draft generation failed; using template: ${String(error)}`)
  }

  const emailDraft = await prisma.emailDraft.create({
    data: {
      user_id: userId,
      job_id: jobId,
      resume_id: resumeId,
      recipient_email: job.recipient_email,
      subject: generated.subject,
      body: generated.body,
      status: 'draft',
    },
  })

  const application = await prisma.application.findFirst({
    where: { user_id: userId, job_id: jobId },
  })
  if (application) {
    await prisma.application.update({
      where: { id: application.id },
      data: { email_draft_id: emailDraft.id, resume_id: resumeId },
    })
  } else {
    await prisma.application.create({
      data: {
        user_id: userId,
        job_id: jobId,
        resume_id: resumeId,
        email_draft_id: emailDraft.id,
        status: 'draft',
      },
    })
  }

  logger.info(`Saved email draft ${emailDraft.id}`)
  return {
    id: emailDraft.id,
    subject: emailDraft.subject,
    body: emailDraft.body,
    recipientEmail: emailDraft.recipient_email,
  }
}
