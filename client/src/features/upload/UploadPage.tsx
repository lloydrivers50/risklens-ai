import { useState, useCallback } from 'react'
import { Upload, FileText, X, Send, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { EmptyState } from '@/shared/components/EmptyState'
import { cn, formatDate, formatLatency, formatCurrency, getTaskTypeLabel } from '@/shared/lib/utils'
import { mockTasks } from '@/services/mock-data'
import type { TaskType, Task } from '@/types/api'

const taskTypes: Array<{ value: TaskType; label: string; description: string }> = [
  { value: 'extraction', label: 'Extract Fields', description: 'Pull structured data from documents' },
  { value: 'summarisation', label: 'Summarise', description: 'Generate concise document summaries' },
  { value: 'risk_assessment', label: 'Assess Risk', description: 'Score and grade risk factors' },
]

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [taskType, setTaskType] = useState<TaskType>('extraction')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const completedTasks = mockTasks.filter((t) => t.status === 'completed')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Upload Document</h1>
        <p className="text-sm text-muted mt-1">
          Upload insurance documents for AI-powered extraction, summarisation, or risk assessment
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Task Type</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-3 gap-3">
              {taskTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTaskType(t.value)}
                  className={cn(
                    'rounded-lg border-2 p-4 text-left transition-all duration-150',
                    taskType === t.value
                      ? 'border-accent bg-accent-light/50'
                      : 'border-border hover:border-border-strong',
                  )}
                >
                  <p className="text-sm font-semibold text-primary">{t.label}</p>
                  <p className="text-xs text-muted mt-1">{t.description}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Supports PDF documents up to 10MB</CardDescription>
            </CardHeader>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                'relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200',
                isDragOver
                  ? 'border-accent bg-accent-light/30'
                  : 'border-border hover:border-border-strong',
              )}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-accent" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-primary">{file.name}</p>
                    <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="ml-4 rounded-lg p-1 text-muted hover:bg-surface-tertiary hover:text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-10 w-10 text-muted mb-3" />
                  <p className="text-sm text-primary font-medium">
                    Drag & drop your document here
                  </p>
                  <p className="text-xs text-muted mt-1 mb-4">or</p>
                  <label className="cursor-pointer">
                    <span className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
                      Browse files
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>

            {file && (
              <div className="mt-4 flex justify-end">
                <Button size="lg">
                  <Send className="h-4 w-4" />
                  Process with {getTaskTypeLabel(taskType)}
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 pb-3">
              <CardTitle>Recent Results</CardTitle>
            </div>
            <div className="divide-y divide-border">
              {completedTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={cn(
                    'w-full px-6 py-3 text-left hover:bg-surface-secondary transition-colors',
                    selectedTask?.id === task.id && 'bg-accent-light/30',
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-primary truncate max-w-[160px]">
                      {task.document_name.replace('.pdf', '')}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Badge>{getTaskTypeLabel(task.type)}</Badge>
                    <span>{task.latency_ms && formatLatency(task.latency_ms)}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {selectedTask?.result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-accent" />
                  {selectedTask.document_name}
                </CardTitle>
                <CardDescription>
                  {getTaskTypeLabel(selectedTask.type)} &middot; {selectedTask.model} &middot;{' '}
                  {selectedTask.latency_ms && formatLatency(selectedTask.latency_ms)} &middot;{' '}
                  {selectedTask.cost_usd && formatCurrency(selectedTask.cost_usd)} &middot;{' '}
                  {formatDate(selectedTask.created_at)}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTask(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <pre className="rounded-lg bg-primary p-4 text-sm text-primary-foreground overflow-auto font-mono leading-relaxed">
            {JSON.stringify(selectedTask.result, null, 2)}
          </pre>
        </Card>
      )}

      {!selectedTask && completedTasks.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No results yet"
          description="Upload a document to see extraction results here"
        />
      )}
    </div>
  )
}
