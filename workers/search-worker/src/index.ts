import { Worker, Queue } from 'bullmq'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { logger } from './lib/logger'
import { searchJobs } from './services/job-search.service'
import { calculateMatchScore } from './services/matching.service'

config()

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const jobSearchQueue = new Queue('job-search', { connection })

// Worker for job search automation
const jobSearchWorker = new Worker(
  'job-search',
  async (job) => {
    logger.info(`Processing job search: ${job.id}`)

    const { userId, preferences } = job.data

    try {
      // Search for jobs from various sources
      const jobs = await searchJobs(preferences)

      logger.info(`Found ${jobs.length} jobs for user ${userId}`)

      // Calculate match scores for each job
      const matchedJobs = await Promise.all(
        jobs.map(async (jobData) => {
          const matchScore = await calculateMatchScore(userId, jobData.id)
          return { ...jobData, matchScore }
        })
      )

      // Filter jobs with match score > 0.6
      const goodMatches = matchedJobs.filter((j) => j.matchScore > 0.6)

      logger.info(`Found ${goodMatches.length} good matches for user ${userId}`)

      return {
        total: jobs.length,
        matches: goodMatches.length,
        jobs: goodMatches,
      }
    } catch (error) {
      logger.error(`Job search failed for user ${userId}:`, error)
      throw error
    }
  },
  { connection, concurrency: 5 }
)

jobSearchWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`)
})

jobSearchWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err)
})

// Schedule nightly job search (runs at 1 AM)
async function scheduleNightlySearch() {
  await jobSearchQueue.add(
    'nightly-search',
    { type: 'nightly' },
    {
      repeat: {
        pattern: '0 1 * * *', // 1 AM every day
      },
    }
  )
  logger.info('Scheduled nightly job search')
}

// Start the worker
;(async () => {
  await scheduleNightlySearch()
  logger.info('🚀 Search worker started')
})()

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing worker')
  await jobSearchWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing worker')
  await jobSearchWorker.close()
  process.exit(0)
})
