import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useEffect } from 'react'
import { api } from './api'
import type { Task, TaskType, PlaygroundRequest } from '@/types/api'

export function useTasks(type?: TaskType) {
  return useQuery({
    queryKey: ['tasks', type],
    queryFn: () => api.tasks.list(type ? { type } : undefined),
  })
}

export function useTask(id: string | null, onComplete?: (task: Task) => void) {
  const calledForRef = useRef<string | null>(null)

  const query = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.tasks.get(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (status === 'pending' || status === 'processing') {
        return 2000
      }
      return false
    },
  })

  const task = query.data
  useEffect(() => {
    if (
      task &&
      (task.status === 'completed' || task.status === 'failed') &&
      calledForRef.current !== task.id
    ) {
      calledForRef.current = task.id
      onComplete?.(task)
    }
  }, [task, onComplete])

  return query
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.health.get(),
    refetchInterval: 30_000,
    retry: false,
  })
}

export function useExtractMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => api.tasks.extract(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useSummariseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => api.tasks.summarise(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useAssessRiskMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => api.tasks.assessRisk(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function usePlaygroundMutation() {
  return useMutation({
    mutationFn: (body: PlaygroundRequest) => api.playground.run(body),
  })
}
