export interface Job {
  id: string
  external_id: string
  source: JobSource
  title: string
  company: string
  company_logo?: string | null
  description: string
  location?: string | null
  job_type?: JobType | null
  experience_level?: ExperienceLevel | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  url: string
  tags: string[]
  status: JobStatus
  posted_at?: Date | null
  expires_at?: Date | null
  created_at: Date
  updated_at: Date
}

export type JobSource = 
  | 'greenhouse' 
  | 'lever' 
  | 'remoteok' 
  | 'hackernews' 
  | 'reddit' 
  | 'company_website'
  | 'manual'

export type JobType = 
  | 'full-time' 
  | 'part-time' 
  | 'contract' 
  | 'freelance' 
  | 'internship' 
  | 'remote'

export type ExperienceLevel = 
  | 'entry' 
  | 'junior' 
  | 'mid' 
  | 'senior' 
  | 'lead' 
  | 'principal'

export type JobStatus = 'active' | 'closed' | 'filled' | 'expired'

export interface SavedJob {
  id: string
  user_id: string
  job_id: string
  job?: Job
  match_score?: number | null
  missing_skills: string[]
  notes?: string | null
  created_at: Date
}

export interface JobFilters {
  search?: string
  location?: string
  salary_min?: number
  salary_max?: number
  experience_level?: ExperienceLevel
  job_type?: JobType
  source?: JobSource
  tags?: string[]
  limit?: number
  offset?: number
}

export interface JobMatch {
  job_id: string
  match_score: number
  matching_skills: string[]
  missing_skills: string[]
  recommendations: string[]
}
