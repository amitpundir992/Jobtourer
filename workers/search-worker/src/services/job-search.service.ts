import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from '@jobtourer/database'
import { logger } from '../lib/logger'
import type { UserPreferences } from '@jobtourer/types'

interface RawJobData {
  external_id: string
  source: string
  title: string
  company: string
  description: string
  location?: string
  url: string
  tags: string[]
}

export async function searchJobs(preferences: UserPreferences): Promise<any[]> {
  const allJobs: RawJobData[] = []

  // Search from multiple sources
  const sources = [
    searchGreenhouseJobs,
    searchLeverJobs,
    searchRemoteOKJobs,
    searchHackerNewsJobs,
  ]

  await Promise.allSettled(
    sources.map(async (sourceFn) => {
      try {
        const jobs = await sourceFn(preferences)
        allJobs.push(...jobs)
      } catch (error) {
        logger.error(`Error searching jobs from ${sourceFn.name}:`, error)
      }
    })
  )

  // Save jobs to database
  const savedJobs = await Promise.all(
    allJobs.map(async (job) => {
      try {
        return await prisma.job.upsert({
          where: { external_id: job.external_id },
          update: { updated_at: new Date() },
          create: {
            ...job,
            status: 'active',
          },
        })
      } catch (error) {
        logger.error(`Error saving job ${job.external_id}:`, error)
        return null
      }
    })
  )

  return savedJobs.filter(Boolean)
}

async function searchGreenhouseJobs(
  _preferences: UserPreferences
): Promise<RawJobData[]> {
  // Placeholder - implement actual Greenhouse API integration
  logger.info('Searching Greenhouse jobs...')
  return []
}

async function searchLeverJobs(
  _preferences: UserPreferences
): Promise<RawJobData[]> {
  // Placeholder - implement actual Lever API integration
  logger.info('Searching Lever jobs...')
  return []
}

async function searchRemoteOKJobs(
  _preferences: UserPreferences
): Promise<RawJobData[]> {
  try {
    logger.info('Searching RemoteOK jobs...')
    const { data } = await axios.get('https://remoteok.com/api')

    // RemoteOK returns JSON array
    const jobs = data.slice(1, 50) // Skip first element (metadata)

    return jobs.map((job: any) => ({
      external_id: `remoteok-${job.id}`,
      source: 'remoteok',
      title: job.position,
      company: job.company,
      description: job.description || '',
      location: job.location || 'Remote',
      url: job.url,
      tags: job.tags || [],
    }))
  } catch (error) {
    logger.error('Error searching RemoteOK:', error)
    return []
  }
}

async function searchHackerNewsJobs(
  _preferences: UserPreferences
): Promise<RawJobData[]> {
  try {
    logger.info('Searching Hacker News jobs...')

    // Get "Who is hiring?" thread
    const { data } = await axios.get(
      'https://hacker-news.firebaseio.com/v0/item/39151747.json'
    )

    // Parse job comments
    const jobIds = data.kids?.slice(0, 50) || []
    const jobs: RawJobData[] = []

    for (const id of jobIds) {
      try {
        const { data: comment } = await axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        )

        if (comment.text) {
          const $ = cheerio.load(comment.text)
          const text = $.text()

          // Extract company name (usually first line)
          const lines = text.split('\n').filter((l) => l.trim())
          const company = lines[0] || 'Unknown'

          jobs.push({
            external_id: `hn-${id}`,
            source: 'hackernews',
            title: lines[1] || 'Position available',
            company,
            description: text,
            location: 'See description',
            url: `https://news.ycombinator.com/item?id=${id}`,
            tags: [],
          })
        }
      } catch (error) {
        logger.error(`Error parsing HN job ${id}:`, error)
      }
    }

    return jobs
  } catch (error) {
    logger.error('Error searching Hacker News:', error)
    return []
  }
}
