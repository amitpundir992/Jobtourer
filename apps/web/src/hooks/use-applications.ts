import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, handleApiError } from '@/lib/api-client'
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
} from '@jobtourer/types'

export const useApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/applications')
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
  })
}

export const useApplication = (applicationId: string) => {
  return useQuery({
    queryKey: ['applications', applicationId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/applications/${applicationId}`)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    enabled: !!applicationId,
  })
}

export const useCreateApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      try {
        const { data } = await apiClient.post('/applications', input)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export const useUpdateApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateApplicationInput & { id: string }) => {
      try {
        const { data } = await apiClient.patch(`/applications/${id}`, input)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.id],
      })
    },
  })
}

export const useDeleteApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (applicationId: string) => {
      try {
        const { data } = await apiClient.delete(
          `/applications/${applicationId}`
        )
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
