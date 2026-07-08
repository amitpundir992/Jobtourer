export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  tier: SubscriptionTier
  status: SubscriptionStatus
  current_period_start?: Date | null
  current_period_end?: Date | null
  cancel_at?: Date | null
  created_at: Date
  updated_at: Date
}

export type SubscriptionTier = 'free' | 'pro' | 'premium'

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'incomplete' 
  | 'trialing'

export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  limits: SubscriptionLimits
  stripe_price_id?: string
}

export interface SubscriptionLimits {
  daily_job_searches: number
  daily_email_drafts: number
  max_resumes: number
  ai_features: boolean
  priority_support: boolean
  advanced_matching: boolean
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '20 job searches per day',
      '5 email drafts per day',
      '1 resume',
      'Basic AI matching',
    ],
    limits: {
      daily_job_searches: 20,
      daily_email_drafts: 5,
      max_resumes: 1,
      ai_features: false,
      priority_support: false,
      advanced_matching: false,
    },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: 19,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited job searches',
      'Unlimited email drafts',
      '5 resumes',
      'Advanced AI matching',
      'Priority support',
    ],
    limits: {
      daily_job_searches: -1, // unlimited
      daily_email_drafts: -1,
      max_resumes: 5,
      ai_features: true,
      priority_support: true,
      advanced_matching: true,
    },
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    price: 49,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Pro',
      'AI resume optimization',
      'Company insights',
      'Interview preparation',
      'Referral finder',
    ],
    limits: {
      daily_job_searches: -1,
      daily_email_drafts: -1,
      max_resumes: -1, // unlimited
      ai_features: true,
      priority_support: true,
      advanced_matching: true,
    },
  },
}

export interface CreateCheckoutSessionInput {
  tier: SubscriptionTier
  success_url: string
  cancel_url: string
}

export interface CreatePortalSessionInput {
  return_url: string
}
