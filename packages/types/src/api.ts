export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  pagination?: PaginationMeta
}

export interface ApiError {
  message: string
  code?: string
  details?: any
  statusCode?: number
}

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
  has_more: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// API Request/Response helpers
export type ApiRequest<T = any> = {
  params?: Record<string, string>
  query?: Record<string, any>
  body?: T
}

export type ApiHandler<TInput = any, TOutput = any> = (
  request: ApiRequest<TInput>
) => Promise<ApiResponse<TOutput>>

// Common query parameters
export interface ListQueryParams {
  limit?: number
  offset?: number
  sort_by?: string
  order?: 'asc' | 'desc'
  search?: string
}

// Webhook types
export interface WebhookEvent<T = any> {
  id: string
  type: string
  data: T
  timestamp: Date
}

export interface StripeWebhookEvent extends WebhookEvent {
  type: 
    | 'customer.subscription.created'
    | 'customer.subscription.updated'
    | 'customer.subscription.deleted'
    | 'invoice.payment_succeeded'
    | 'invoice.payment_failed'
}
