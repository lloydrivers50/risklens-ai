import type {
  Task,
  TaskMetrics,
  TaskType,
  PlaygroundRequest,
  PlaygroundResponse,
  EvaluationRun,
} from '@/types/api'

const API_BASE = '/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  tasks: {
    list: (params?: { type?: TaskType; limit?: number; offset?: number }) => {
      const search = new URLSearchParams()
      if (params?.type) search.set('type', params.type)
      if (params?.limit) search.set('limit', String(params.limit))
      if (params?.offset) search.set('offset', String(params.offset))
      const qs = search.toString()
      return request<Task[]>(`/tasks${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<Task>(`/tasks/${id}`),
    extract: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<Task>('/tasks/extract', {
        method: 'POST',
        body: form,
        headers: {},
      })
    },
    summarise: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<Task>('/tasks/summarise', {
        method: 'POST',
        body: form,
        headers: {},
      })
    },
    assessRisk: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<Task>('/tasks/assess-risk', {
        method: 'POST',
        body: form,
        headers: {},
      })
    },
  },
  metrics: {
    get: () => request<TaskMetrics>('/metrics'),
  },
  playground: {
    run: (body: PlaygroundRequest) =>
      request<PlaygroundResponse>('/playground', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  evaluation: {
    run: (body: { dataset: string; model: string; provider: string; task_type: TaskType }) =>
      request<EvaluationRun>('/evaluate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
}
