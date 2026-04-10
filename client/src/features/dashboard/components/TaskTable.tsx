import { Card, CardHeader, CardTitle } from '@/shared/components/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Badge } from '@/shared/components/Badge'
import { formatDate, formatLatency, formatCurrency, getTaskTypeLabel } from '@/shared/lib/utils'
import type { Task } from '@/types/api'

interface TaskTableProps {
  tasks: Task[]
}

export function TaskTable({ tasks }: TaskTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="p-6 pb-0">
        <CardTitle>Recent Tasks</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Document</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Type</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Model</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Status</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Latency</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Cost</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-surface-secondary transition-colors">
                <td className="px-6 py-3.5">
                  <span className="text-sm font-medium text-primary truncate max-w-[200px] block">
                    {task.document_name}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <Badge>{getTaskTypeLabel(task.type)}</Badge>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-xs text-muted font-mono">
                    {task.model.split('-').slice(0, 2).join('-')}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-6 py-3.5 text-sm text-muted font-mono">
                  {task.latency_ms ? formatLatency(task.latency_ms) : '-'}
                </td>
                <td className="px-6 py-3.5 text-sm text-muted font-mono">
                  {task.cost_usd ? formatCurrency(task.cost_usd) : '-'}
                </td>
                <td className="px-6 py-3.5 text-xs text-muted">
                  {formatDate(task.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
