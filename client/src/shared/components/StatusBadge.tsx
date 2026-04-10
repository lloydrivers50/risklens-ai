import { Badge } from './Badge'
import type { TaskStatus } from '@/types/api'

const statusConfig: Record<TaskStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  completed: { label: 'Completed', variant: 'success' },
  processing: { label: 'Processing', variant: 'info' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
