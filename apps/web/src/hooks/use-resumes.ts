import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, handleApiError } from '@/lib/api-client'
import type { UpdateResumeInput } from '@jobtourer/types'

export const useResumes = () => {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/resumes')
        return data.resumes
      } catch (error) {
        throw handleApiError(error)
      }
    },
  })
}

export const useResume = (resumeId: string) => {
  return useQuery({
    queryKey: ['resumes', resumeId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/resumes/${resumeId}`)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    enabled: !!resumeId,
  })
}

export const useUploadResume = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        const { data } = await apiClient.post('/resumes/upload', formData)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
    },
  })
}

export const useUpdateResume = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateResumeInput & { id: string }) => {
      try {
        const { data } = await apiClient.patch(`/resumes/${id}`, input)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      queryClient.invalidateQueries({ queryKey: ['resumes', variables.id] })
    },
  })
}

export const useDeleteResume = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resumeId: string) => {
      try {
        const { data } = await apiClient.delete(`/resumes/${resumeId}`)
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
    },
  })
}

export const useSetDefaultResume = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resumeId: string) => {
      try {
        const { data } = await apiClient.post(
          `/resumes/${resumeId}/set-default`
        )
        return data
      } catch (error) {
        throw handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
    },
  })
}
