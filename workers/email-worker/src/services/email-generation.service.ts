import { prisma } from '@jobtourer/database'
import { logger } from '../lib/logger'
import { generateText } from '../lib/ai'

interface GenerateEmailInput {
  userId: string
  jobId: string
  resumeId: string
  tone?: 'professional' | 'casual' | 'enthusiastic'
}

interface EmailOutput {
  subject: string
  body: string
}

export async function generateEmailDraft(
  input: GenerateEmailInput
): Promise<EmailOutput> {
  const { userId, jobId, resumeId, tone = 'professional' } = input

  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      throw new Error('Job not found')
    }

    // Get resume details
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    })

    if (!resume || !resume.parsed_data) {
      throw new Error('Resume not found or not parsed')
    }

    const resumeData = resume.parsed_data as any

    // Generate email using AI
    const prompt = `
You are a professional job application email writer. Generate a personalized job application email.

User Details:
- Name: ${user.name}
- Email: ${user.email}

Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location || 'Not specified'}
- Description: ${job.description.substring(0, 500)}...

Resume Highlights:
- Skills: ${resumeData.skills?.join(', ') || 'N/A'}
- Recent Experience: ${JSON.stringify(resumeData.experience?.[0]) || 'N/A'}
- Education: ${JSON.stringify(resumeData.education?.[0]) || 'N/A'}

Tone: ${tone}

Generate:
1. A compelling subject line (max 80 characters)
2. A personalized email body (3-4 paragraphs) that:
   - Opens with enthusiasm about the role
   - Highlights relevant experience and skills
   - Shows genuine interest in the company
   - Includes a clear call to action
   - ${tone === 'professional' ? 'Maintains a professional tone' : tone === 'casual' ? 'Uses a friendly, conversational tone' : 'Shows genuine excitement and passion'}

Format your response as JSON:
{
  "subject": "your subject line",
  "body": "your email body"
}
`

    const response = await generateText(prompt)

    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const { subject, body } = JSON.parse(jsonMatch[0])

    // Save email draft to database
    const emailDraft = await prisma.emailDraft.create({
      data: {
        user_id: userId,
        job_id: jobId,
        subject,
        body,
        status: 'draft',
      },
    })

    logger.info(`Saved email draft ${emailDraft.id}`)

    return { subject, body }
  } catch (error) {
    logger.error('Error generating email:', error)
    throw error
  }
}
