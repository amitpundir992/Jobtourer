import axios, { AxiosError, AxiosInstance } from 'axios'

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
})

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status || 500
    const responseData = error.response?.data as
      { message?: string; error?: string; details?: unknown } | undefined
    const message =
      responseData?.message || responseData?.error || error.message
    const details = responseData?.details
    return new ApiError(statusCode, message, details)
  }
  return new ApiError(500, 'An unexpected error occurred')
}
