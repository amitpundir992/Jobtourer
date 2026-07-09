import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Job schemas
export const jobFiltersSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  experience_level: z.string().optional(),
  job_type: z.string().optional(),
  limit: z.coerce.number().default(20),
  offset: z.coerce.number().default(0),
})

// Resume schemas
export const updateResumeSchema = z.object({
  title: z.string().min(1).optional(),
  is_default: z.boolean().optional(),
})

// Application schemas
export const createApplicationSchema = z.object({
  job_id: z.string().uuid(),
  resume_id: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export const updateApplicationSchema = z.object({
  status: z
    .enum([
      'draft',
      'applied',
      'interviewing',
      'offered',
      'rejected',
      'accepted',
      'withdrawn',
    ])
    .optional(),
  resume_id: z.string().uuid().optional(),
  applied_at: z.coerce.date().optional(),
  follow_up_at: z.coerce.date().optional(),
  notes: z.string().optional(),
})

// Email schemas
export const generateEmailSchema = z.object({
  job_id: z.string().uuid(),
  resume_id: z.string().uuid(),
  tone: z
    .enum(['professional', 'casual', 'enthusiastic'])
    .default('professional'),
  include_portfolio: z.boolean().default(false),
})

// User preferences schema
export const updatePreferencesSchema = z.object({
  job_types: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  experience_levels: z.array(z.string()).optional(),
  salary_range: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.string(),
    })
    .optional(),
  keywords: z.array(z.string()).optional(),
  email_notifications: z.boolean().optional(),
  search_frequency: z.enum(['daily', 'weekly']).optional(),
})
