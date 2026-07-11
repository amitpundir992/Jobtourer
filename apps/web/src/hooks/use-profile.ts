import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient, handleApiError } from '@/lib/api-client'

export interface ProfileInput {
  preferred_role?: string
  skills?: string[]
  experience?: string
  preferred_locations?: string[]
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string
  work_preference?: string
  preferred_companies?: string[]
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/profile')
        return data.profile
      } catch (error) {
        throw handleApiError(error)
      }
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ProfileInput) => {
      try {
        const { data } = await apiClient.patch('/profile', input)
        return data.profile
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
