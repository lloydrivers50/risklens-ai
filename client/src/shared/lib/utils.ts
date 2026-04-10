import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'text-success bg-success-light'
    case 'processing':
      return 'text-accent-foreground bg-accent-light'
    case 'pending':
      return 'text-warning bg-warning-light'
    case 'failed':
      return 'text-danger bg-danger-light'
    default:
      return 'text-muted bg-surface-tertiary'
  }
}

export function getTaskTypeLabel(type: string): string {
  switch (type) {
    case 'extraction':
      return 'Extraction'
    case 'summarisation':
      return 'Summarisation'
    case 'risk_assessment':
      return 'Risk Assessment'
    default:
      return type
  }
}

export function getProviderLabel(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return 'Anthropic'
    case 'openai':
      return 'OpenAI'
    case 'local':
      return 'Local'
    default:
      return provider
  }
}
