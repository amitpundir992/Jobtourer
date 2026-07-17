import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import path from 'node:path'
import { logger } from './logger'

config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '../../.env') })

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai' // openai, gemini, claude

// Initialize clients
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const gemini = process.env.GOOGLE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null

const claude = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function generateText(prompt: string): Promise<string> {
  try {
    switch (AI_PROVIDER) {
      case 'openai':
        return await generateWithOpenAI(prompt)
      case 'gemini':
        return await generateWithGemini(prompt)
      case 'claude':
        return await generateWithClaude(prompt)
      default:
        throw new Error(`Unknown AI provider: ${AI_PROVIDER}`)
    }
  } catch (error) {
    logger.error('Error generating text:', error)
    throw error
  }
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI client not initialized')
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content || ''
}

async function generateWithGemini(prompt: string): Promise<string> {
  if (!gemini) {
    throw new Error('Gemini client not initialized')
  }

  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

async function generateWithClaude(prompt: string): Promise<string> {
  if (!claude) {
    throw new Error('Claude client not initialized')
  }

  const message = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : ''
}
