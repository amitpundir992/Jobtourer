export interface EmailDraft {
  id: string
  user_id: string
  job_id: string
  subject: string
  body: string
  gmail_draft_id?: string | null
  status: EmailStatus
  sent_at?: Date | null
  created_at: Date
  updated_at: Date
}

export type EmailStatus = 'draft' | 'sent' | 'failed'

export interface GenerateEmailInput {
  job_id: string
  resume_id: string
  tone?: 'professional' | 'casual' | 'enthusiastic'
  include_portfolio?: boolean
}

export interface GenerateEmailResponse {
  subject: string
  body: string
  suggestions?: string[]
}

export interface SendEmailInput {
  draft_id: string
  send_time?: Date
}

export interface EmailTemplate {
  name: string
  subject: string
  body: string
  variables: string[]
}
