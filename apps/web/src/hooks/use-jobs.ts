import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, handleApiError } from '@/lib/api-client'
import type { JobFilters } from '@jobtourer/types'

export const useJobs = (filters?: JobFilters) => {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/jobs', { params: filters })
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
  })
}

export const useJob = (jobId: string) => {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/jobs/${jobId}`)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    enabled: !!jobId,
  })
}

export const useSaveJob = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      try {
        const { data } = await apiClient.post(`/jobs/${jobId}/save`)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
    },
  })
}

export const useUnsaveJob = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      try {
        const { data } = await apiClient.delete(`/jobs/${jobId}/save`)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
    },
  })
}

export const useSavedJobs = () => {
  return useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/jobs/saved')
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
  })
}
