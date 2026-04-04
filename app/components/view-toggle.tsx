import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/ai'
import { CodeIcon, UsersIcon } from 'lucide-react'

interface ViewToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div role="radiogroup" aria-label="View mode" className="inline-flex items-center rounded-lg border border-border/40 bg-ds-surface-1 p-0.5">
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'builder'}
        onClick={() => onChange('builder')}
        className={cn(
          'inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:min-h-0',
          mode === 'builder'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-ds-text-secondary hover:text-ds-text-primary',
        )}
      >
        <CodeIcon className="size-3.5" />
        Builder
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'stakeholder'}
        onClick={() => onChange('stakeholder')}
        className={cn(
          'inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:min-h-0',
          mode === 'stakeholder'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-ds-text-secondary hover:text-ds-text-primary',
        )}
      >
        <UsersIcon className="size-3.5" />
        Stakeholder
      </button>
    </div>
  )
}
