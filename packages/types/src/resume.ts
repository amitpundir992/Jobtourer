export interface Resume {
  id: string
  user_id: string
  title: string
  file_url: string
  file_name: string
  file_size: number
  file_type: string
  is_default: boolean
  parsed_data?: ParsedResumeData | null
  created_at: Date
  updated_at: Date
}

export interface ParsedResumeData {
  parse_status?: 'parsed' | 'empty' | 'failed'
  parse_error?: string
  raw_text?: string
  skills?: string[]
  experience?: Experience[]
  education?: Education[]
  projects?: string[]
  certifications?: string[]
  summary?: string
}

export interface Experience {
  title: string
  company: string
  location?: string
  duration: string
  start_date?: string
  end_date?: string
  description?: string
  highlights?: string[]
}

export interface Education {
  degree: string
  institution: string
  location?: string
  graduation_year?: string
  field_of_study?: string
  gpa?: string
}

export interface CreateResumeInput {
  title: string
  file: File
}

export interface UpdateResumeInput {
  title?: string
  is_default?: boolean
  parsed_data?: ParsedResumeData
}

export interface ResumeUploadResponse {
  resume: Resume
  parsed_data?: ParsedResumeData
}
