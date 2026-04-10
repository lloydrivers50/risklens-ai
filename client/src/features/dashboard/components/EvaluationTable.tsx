import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { formatLatency, getTaskTypeLabel } from '@/shared/lib/utils'
import type { EvaluationRun } from '@/types/api'

interface EvaluationTableProps {
  runs: EvaluationRun[]
}

export function EvaluationTable({ runs }: EvaluationTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="p-6 pb-0">
        <CardTitle>Evaluation Runs</CardTitle>
        <CardDescription>Model performance across labelled datasets</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Dataset</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Model</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Task</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Accuracy</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">F1</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Latency (p50)</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Hallucination</th>
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-surface-secondary transition-colors">
                <td className="px-6 py-3.5">
                  <span className="text-sm font-medium text-primary font-mono">{run.dataset}</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-xs text-muted font-mono">
                    {run.model.split('-').slice(0, 2).join('-')}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <Badge>{getTaskTypeLabel(run.task_type)}</Badge>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-sm font-semibold text-primary">
                    {run.metrics ? `${(run.metrics.accuracy * 100).toFixed(0)}%` : '-'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-muted font-mono">
                  {run.metrics ? run.metrics.f1_score.toFixed(2) : '-'}
                </td>
                <td className="px-6 py-3.5 text-sm text-muted font-mono">
                  {run.metrics ? formatLatency(run.metrics.latency_p50_ms) : '-'}
                </td>
                <td className="px-6 py-3.5">
                  {run.metrics ? (
                    <Badge variant={run.metrics.hallucination_rate <= 0.03 ? 'success' : 'warning'}>
                      {(run.metrics.hallucination_rate * 100).toFixed(0)}%
                    </Badge>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-3.5 text-sm text-muted font-mono">
                  {run.metrics ? `$${run.metrics.cost_usd.toFixed(2)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
