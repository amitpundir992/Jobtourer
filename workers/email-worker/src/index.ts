import { Worker, Queue } from 'bullmq'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { logger } from './lib/logger'
import { generateEmailDraft } from './services/email-generation.service'
import { createGmailDraft } from './services/gmail.service'

config()

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const emailQueue = new Queue('email-generation', { connection })

// Worker for email draft generation
const emailWorker = new Worker(
  'email-generation',
  async (job) => {
    logger.info(`Processing email generation: ${job.id}`)

    const { userId, jobId, resumeId, tone = 'professional' } = job.data

    try {
      // Generate email content using AI
      const { subject, body } = await generateEmailDraft({
        userId,
        jobId,
        resumeId,
        tone,
      })

      logger.info(`Generated email for job ${jobId}`)

      // Create draft in Gmail (if configured)
      let gmailDraftId: string | null = null
      try {
        gmailDraftId = await createGmailDraft(userId, subject, body, resumeId)
        logger.info(`Created Gmail draft: ${gmailDraftId}`)
      } catch (error) {
        logger.warn('Failed to create Gmail draft:', error)
        // Continue even if Gmail fails
      }

      return {
        subject,
        body,
        gmailDraftId,
      }
    } catch (error) {
      logger.error(`Email generation failed:`, error)
      throw error
    }
  },
  { connection, concurrency: 3 }
)

emailWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`)
})

emailWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err)
})

// Export queue for adding jobs
export { emailQueue }

// Start the worker
logger.info('🚀 Email worker started')

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing worker')
  await emailWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing worker')
  await emailWorker.close()
  process.exit(0)
})
