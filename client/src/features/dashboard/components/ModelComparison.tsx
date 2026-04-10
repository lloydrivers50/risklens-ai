import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/components/Card'
import type { TaskMetrics } from '@/types/api'

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b']

interface ModelComparisonProps {
  data: TaskMetrics['model_comparison']
}

export function ModelComparison({ data }: ModelComparisonProps) {
  const chartData = data.map((m) => ({
    name: m.model.split('-').slice(0, 2).join(' '),
    accuracy: Math.round(m.avg_accuracy * 100),
    latency: m.avg_latency_ms,
    cost: m.avg_cost_usd,
    tasks: m.task_count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Comparison</CardTitle>
        <CardDescription>Accuracy by model across all task types</CardDescription>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
              }}
              formatter={(value) => [`${value}%`, 'Accuracy']}
            />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} barSize={48}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {data.map((m, i) => (
          <div key={m.model} className="rounded-lg bg-surface-secondary p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                {m.provider}
              </span>
            </div>
            <p className="text-xs text-muted">
              {m.avg_latency_ms.toLocaleString()}ms avg &middot; ${m.avg_cost_usd.toFixed(3)}/task
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
