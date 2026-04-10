import {
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { MetricCard } from './components/MetricCard'
import { TaskChart } from './components/TaskChart'
import { ModelComparison } from './components/ModelComparison'
import { TaskTable } from './components/TaskTable'
import { EvaluationTable } from './components/EvaluationTable'
import { mockMetrics, mockTasks, mockEvaluationRuns } from '@/services/mock-data'
import { formatNumber, formatCurrency, formatLatency } from '@/shared/lib/utils'

export function DashboardPage() {
  const metrics = mockMetrics

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Real-time overview of document processing performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Total Tasks"
          value={formatNumber(metrics.total_tasks)}
          icon={Activity}
          trend={{ value: '12%', positive: true }}
        />
        <MetricCard
          title="Completed"
          value={formatNumber(metrics.completed_tasks)}
          subtitle={`${((metrics.completed_tasks / metrics.total_tasks) * 100).toFixed(0)}% success rate`}
          icon={CheckCircle2}
          iconColor="text-success"
          iconBg="bg-success-light"
        />
        <MetricCard
          title="Failed"
          value={formatNumber(metrics.failed_tasks)}
          icon={AlertTriangle}
          iconColor="text-danger"
          iconBg="bg-danger-light"
        />
        <MetricCard
          title="Avg Latency"
          value={formatLatency(metrics.avg_latency_ms)}
          subtitle={`p95: ${formatLatency(metrics.p95_latency_ms)}`}
          icon={Clock}
          iconColor="text-warning"
          iconBg="bg-warning-light"
        />
        <MetricCard
          title="Total Tokens"
          value={formatNumber(metrics.total_tokens)}
          icon={Zap}
          iconColor="text-info"
          iconBg="bg-info-light"
        />
        <MetricCard
          title="Total Cost"
          value={formatCurrency(metrics.total_cost_usd)}
          trend={{ value: '8%', positive: false }}
          icon={DollarSign}
          iconColor="text-success"
          iconBg="bg-success-light"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskChart data={metrics.daily_tasks} />
        <ModelComparison data={metrics.model_comparison} />
      </div>

      <EvaluationTable runs={mockEvaluationRuns} />

      <TaskTable tasks={mockTasks} />
    </div>
  )
}
