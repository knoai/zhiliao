import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { feishuApi, type FeishuBindingStatus } from '@/api/feishu'

const feishuKeys = {
  all: ['feishu'] as const,
  binding: () => [...feishuKeys.all, 'binding'] as const,
}

export function useFeishuBinding() {
  return useQuery<FeishuBindingStatus, Error>({
    queryKey: feishuKeys.binding(),
    queryFn: () => feishuApi.getBinding(),
  })
}

export function useFeishuCallback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => feishuApi.callback(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feishuKeys.binding() })
    },
  })
}

export function useFeishuUnbind() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => feishuApi.unbind(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feishuKeys.binding() })
    },
  })
}
