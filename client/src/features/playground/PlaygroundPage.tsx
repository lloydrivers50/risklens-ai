import { useState } from 'react'
import { Send, RotateCcw, Sparkles, Clock, Coins, Hash } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { cn, formatLatency, formatCurrency, formatNumber } from '@/shared/lib/utils'
import type { TaskType, ModelProvider } from '@/types/api'

const models: Array<{ provider: ModelProvider; model: string; label: string }> = [
  { provider: 'anthropic', model: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { provider: 'openai', model: 'gpt-4o', label: 'GPT-4o' },
  { provider: 'local', model: 'llama-3.1-8b', label: 'Llama 3.1 8B' },
]

const taskTypes: Array<{ value: TaskType; label: string }> = [
  { value: 'extraction', label: 'Extraction' },
  { value: 'summarisation', label: 'Summarisation' },
  { value: 'risk_assessment', label: 'Risk Assessment' },
]

const samplePrompts: Record<TaskType, string> = {
  extraction:
    'Extract the following fields from this commercial property insurance policy: insured name, policy number, effective date, expiry date, total insured value, deductible, and perils covered.',
  summarisation:
    'Provide a concise summary of this insurance document, highlighting key coverage terms, exclusions, and any notable endorsements.',
  risk_assessment:
    'Assess the risk profile of this property based on the inspection report. Provide a risk score (0-100), grade (A-F), key risk factors, and recommendations.',
}

interface MockResult {
  response: string
  latency_ms: number
  tokens: { input: number; output: number; total: number }
  cost_usd: number
}

export function PlaygroundPage() {
  const [selectedModel, setSelectedModel] = useState(0)
  const [selectedTask, setSelectedTask] = useState<TaskType>('extraction')
  const [prompt, setPrompt] = useState(samplePrompts.extraction)
  const [temperature, setTemperature] = useState(0.0)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<MockResult | null>(null)

  const handleTaskChange = (task: TaskType) => {
    setSelectedTask(task)
    setPrompt(samplePrompts[task])
  }

  const handleRun = () => {
    setIsRunning(true)
    setResult(null)
    setTimeout(() => {
      setResult({
        response: JSON.stringify(
          selectedTask === 'extraction'
            ? {
                insured_name: 'Acme Corp Ltd',
                policy_number: 'CPP-2024-78432',
                effective_date: '2024-01-15',
                expiry_date: '2025-01-15',
                total_insured_value: 12500000,
                deductible: 50000,
                perils_covered: ['fire', 'flood', 'earthquake', 'business_interruption'],
              }
            : selectedTask === 'summarisation'
              ? {
                  summary:
                    'Commercial property policy for Acme Corp Ltd providing coverage against fire, flood, earthquake, and business interruption. Total insured value of $12.5M with a $50K deductible. Policy effective from 15 Jan 2024 to 15 Jan 2025. Notable exclusion for cyber incidents unless endorsed separately.',
                }
              : {
                  risk_score: 72,
                  risk_grade: 'B',
                  key_risks: ['outdated fire suppression', 'proximity to flood zone', 'high occupancy density'],
                  recommendations: ['upgrade sprinkler system', 'install flood barriers', 'review occupancy limits'],
                },
          null,
          2,
        ),
        latency_ms: 2400 + Math.random() * 3000,
        tokens: { input: 1200 + Math.floor(Math.random() * 800), output: 400 + Math.floor(Math.random() * 600), total: 0 },
        cost_usd: 0.015 + Math.random() * 0.025,
      })
      setIsRunning(false)
    }, 1500 + Math.random() * 1500)
  }

  const handleReset = () => {
    setPrompt(samplePrompts[selectedTask])
    setResult(null)
    setTemperature(0.0)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Playground</h1>
        <p className="text-sm text-muted mt-1">
          Test LLM tasks interactively with different models and parameters
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
              <CardDescription>
                Describe the task or paste document content
              </CardDescription>
            </CardHeader>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-border bg-surface-secondary p-4 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none font-mono"
              placeholder="Enter your prompt..."
            />
            <div className="mt-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                size="lg"
                onClick={handleRun}
                disabled={!prompt.trim() || isRunning}
              >
                {isRunning ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Running...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Response
                  </CardTitle>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLatency(result.latency_ms)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {formatNumber(result.tokens.input + result.tokens.output)} tokens
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {formatCurrency(result.cost_usd)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <pre className="rounded-lg bg-primary p-4 text-sm text-primary-foreground overflow-auto font-mono leading-relaxed max-h-96">
                {result.response}
              </pre>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {models.map((m, i) => (
                <button
                  key={m.model}
                  onClick={() => setSelectedModel(i)}
                  className={cn(
                    'w-full rounded-lg border-2 p-3 text-left transition-all duration-150',
                    selectedModel === i
                      ? 'border-accent bg-accent-light/50'
                      : 'border-border hover:border-border-strong',
                  )}
                >
                  <p className="text-sm font-semibold text-primary">{m.label}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted mt-0.5">
                    {m.provider}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Type</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {taskTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleTaskChange(t.value)}
                  className={cn(
                    'w-full rounded-lg border-2 px-3 py-2 text-left text-sm transition-all duration-150',
                    selectedTask === t.value
                      ? 'border-accent bg-accent-light/50 font-semibold text-primary'
                      : 'border-border text-muted hover:border-border-strong',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-primary">Temperature</span>
                  <span className="font-mono text-muted">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
