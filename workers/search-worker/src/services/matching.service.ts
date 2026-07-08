import { prisma } from '@jobtourer/database'
import { logger } from '../lib/logger'
import { generateText } from '../lib/ai'

export async function calculateMatchScore(
  userId: string,
  jobId: string
): Promise<number> {
  try {
    // Get user's default resume
    const resume = await prisma.resume.findFirst({
      where: { user_id: userId, is_default: true },
    })

    if (!resume || !resume.parsed_data) {
      logger.warn(`No resume found for user ${userId}`)
      return 0
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      logger.warn(`Job ${jobId} not found`)
      return 0
    }

    // Use AI to calculate match score
    const resumeData = resume.parsed_data as any
    const prompt = `
You are a job matching expert. Calculate how well this resume matches the job posting.

Resume Skills: ${resumeData.skills?.join(', ') || 'N/A'}
Resume Experience: ${JSON.stringify(resumeData.experience) || 'N/A'}

Job Title: ${job.title}
Job Company: ${job.company}
Job Description: ${job.description}
Required Experience Level: ${job.experience_level || 'Not specified'}

Return ONLY a number between 0 and 1 representing the match score.
0 = no match, 1 = perfect match.
Consider:
- Skill overlap
- Experience level match
- Industry relevance
- Job requirements alignment

Response format: Just the number (e.g., "0.85")
`

    const response = await generateText(prompt)
    const score = parseFloat(response.trim())

    if (isNaN(score) || score < 0 || score > 1) {
      logger.warn(`Invalid match score: ${response}`)
      return 0.5 // Default to middle score if parsing fails
    }

    // Save the match score
    await prisma.savedJob.upsert({
      where: {
        user_id_job_id: {
          user_id: userId,
          job_id: jobId,
        },
      },
      update: {
        match_score: score,
      },
      create: {
        user_id: userId,
        job_id: jobId,
        match_score: score,
        missing_skills: [],
      },
    })

    return score
  } catch (error) {
    logger.error(`Error calculating match score:`, error)
    return 0
  }
}
