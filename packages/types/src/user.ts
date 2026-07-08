export interface User {
  id: string
  email: string
  name: string
  avatar?: string | null
  email_verified: boolean
  oauth_provider?: string | null
  oauth_id?: string | null
  subscription_tier: 'free' | 'pro' | 'premium'
  preferences?: UserPreferences | null
  created_at: Date
  updated_at: Date
}

export interface UserPreferences {
  job_types?: string[]
  locations?: string[]
  experience_levels?: string[]
  salary_range?: {
    min: number
    max: number
    currency: string
  }
  keywords?: string[]
  email_notifications?: boolean
  search_frequency?: 'daily' | 'weekly'
}

export interface CreateUserInput {
  email: string
  password: string
  name: string
}

export interface UpdateUserInput {
  name?: string
  avatar?: string
  preferences?: UserPreferences
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
}
