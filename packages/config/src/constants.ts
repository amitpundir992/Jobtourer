export const APP_CONFIG = {
  name: 'JobTourer',
  description: 'AI-Powered Job Application Automation',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  api_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
} as const

export const AUTH_CONFIG = {
  jwt_secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwt_expires_in: '7d',
  cookie_name: 'auth_token',
  cookie_max_age: 60 * 60 * 24 * 7, // 7 days
} as const

export const SUBSCRIPTION_CONFIG = {
  free: {
    daily_job_searches: 20,
    daily_email_drafts: 5,
    max_resumes: 1,
  },
  pro: {
    daily_job_searches: -1, // unlimited
    daily_email_drafts: -1,
    max_resumes: 5,
  },
  premium: {
    daily_job_searches: -1,
    daily_email_drafts: -1,
    max_resumes: -1,
  },
} as const

export const JOB_SOURCES = [
  'greenhouse',
  'lever',
  'remoteok',
  'hackernews',
  'reddit',
  'company_website',
] as const

export const FILE_UPLOAD_CONFIG = {
  max_file_size: 10 * 1024 * 1024, // 10MB
  allowed_mime_types: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  allowed_extensions: ['.pdf', '.doc', '.docx'],
} as const

export const RATE_LIMITS = {
  free: {
    requests_per_minute: 10,
    requests_per_hour: 100,
  },
  pro: {
    requests_per_minute: 30,
    requests_per_hour: 500,
  },
  premium: {
    requests_per_minute: 60,
    requests_per_hour: 1000,
  },
} as const

export const SEARCH_CONFIG = {
  default_limit: 20,
  max_limit: 100,
  search_debounce_ms: 300,
} as const

export const EMAIL_CONFIG = {
  from_name: 'JobTourer',
  from_email: process.env.EMAIL_FROM || 'noreply@jobtourer.com',
  reply_to: process.env.EMAIL_REPLY_TO || 'support@jobtourer.com',
} as const

export const STORAGE_CONFIG = {
  provider: process.env.STORAGE_PROVIDER || 'r2', // 'r2' or 's3'
  bucket: process.env.S3_BUCKET_NAME || 'jobtourer-resumes',
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.AWS_ENDPOINT,
} as const
