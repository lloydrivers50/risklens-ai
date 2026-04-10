import type { LucideIcon } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: { value: string; positive: boolean }
  iconColor?: string
  iconBg?: string
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, iconColor, iconBg }: MetricCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">{title}</p>
          <p className="text-2xl font-bold text-primary">{value}</p>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-medium', trend.positive ? 'text-success' : 'text-danger')}>
              {trend.positive ? '+' : ''}{trend.value} vs last week
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-2.5', iconBg || 'bg-accent-light')}>
          <Icon className={cn('h-5 w-5', iconColor || 'text-accent')} />
        </div>
      </div>
    </Card>
  )
}
