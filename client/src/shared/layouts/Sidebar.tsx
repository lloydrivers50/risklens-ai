import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Upload,
  FlaskConical,
  Shield,
  FileText,
  GitBranch,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useHealth } from '@/services/hooks'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Playground', href: '/playground', icon: FlaskConical },
]

export function Sidebar() {
  const { data: health, isError } = useHealth()

  const isConnected = !!health && !isError

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-primary">RiskLens</span>
          <span className="text-base font-light text-accent ml-0.5">AI</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Platform
        </p>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-accent-light text-accent-foreground'
                  : 'text-muted hover:bg-surface-tertiary hover:text-primary',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4 space-y-3">
        <div className="rounded-lg bg-surface-tertiary p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-muted" />
            <span className="text-xs font-medium text-primary">API Status</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <span className="text-xs text-muted">
                  Connected{health.version ? ` (v${health.version})` : ''}
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
                </span>
                <span className="text-xs text-muted">Disconnected</span>
              </>
            )}
          </div>
        </div>

        <a
          href="https://github.com/lloydrivers50/risklens-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:text-primary hover:bg-surface-tertiary transition-colors"
        >
          <GitBranch className="h-3.5 w-3.5" />
          View on GitHub
        </a>
      </div>
    </aside>
  )
}
