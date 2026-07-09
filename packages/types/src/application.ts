import type { Job } from './job'
import type { Resume } from './resume'
import type { EmailDraft } from './email'

export interface Application {
  id: string
  user_id: string
  job_id: string
  resume_id?: string | null
  job?: Job
  resume?: Resume | null
  email_draft?: EmailDraft | null
  status: ApplicationStatus
  email_draft_id?: string | null
  applied_at?: Date | null
  follow_up_at?: Date | null
  notes?: string | null
  created_at: Date
  updated_at: Date
}

export type ApplicationStatus =
  | 'draft'
  | 'applied'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'accepted'
  | 'withdrawn'

export interface CreateApplicationInput {
  job_id: string
  resume_id?: string
  notes?: string
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus
  resume_id?: string
  applied_at?: Date
  follow_up_at?: Date
  notes?: string
}

export interface ApplicationStats {
  total: number
  by_status: Record<ApplicationStatus, number>
  success_rate: number
  average_response_time: number
  recent_applications: Application[]
}
