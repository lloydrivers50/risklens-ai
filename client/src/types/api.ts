export type TaskType = 'extraction' | 'summarisation' | 'risk_assessment'
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ModelProvider = 'anthropic' | 'openai' | 'local'

export interface Task {
  id: string
  type: TaskType
  status: TaskStatus
  model: string
  provider: ModelProvider
  document_name: string
  created_at: string
  completed_at: string | null
  latency_ms: number | null
  token_usage: {
    input: number
    output: number
    total: number
  } | null
  cost_usd: number | null
  result: Record<string, unknown> | null
  error: string | null
}

export interface TaskMetrics {
  total_tasks: number
  completed_tasks: number
  failed_tasks: number
  avg_latency_ms: number
  p95_latency_ms: number
  p99_latency_ms: number
  total_tokens: number
  total_cost_usd: number
  tasks_by_type: Record<TaskType, number>
  tasks_by_status: Record<TaskStatus, number>
  tasks_by_provider: Record<ModelProvider, number>
  daily_tasks: Array<{ date: string; count: number; cost: number }>
  model_comparison: Array<{
    model: string
    provider: ModelProvider
    avg_latency_ms: number
    avg_accuracy: number
    avg_cost_usd: number
    task_count: number
  }>
}

export interface PlaygroundRequest {
  prompt: string
  model: string
  provider: ModelProvider
  task_type: TaskType
  temperature?: number
  max_tokens?: number
}

export interface PlaygroundResponse {
  id: string
  result: string
  model: string
  provider: ModelProvider
  latency_ms: number
  token_usage: {
    input: number
    output: number
    total: number
  }
  cost_usd: number
}

export interface EvaluationRun {
  id: string
  dataset: string
  model: string
  provider: ModelProvider
  task_type: TaskType
  started_at: string
  completed_at: string | null
  metrics: {
    accuracy: number
    f1_score: number
    latency_p50_ms: number
    latency_p95_ms: number
    latency_p99_ms: number
    total_tokens: number
    cost_usd: number
    hallucination_rate: number
  } | null
}
