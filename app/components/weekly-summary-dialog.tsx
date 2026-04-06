import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { WeeklySummary } from '@/lib/ai'
import { useCopySummary } from '@/hooks/use-copy-summary'
import {
  CheckCircle2Icon,
  ClockIcon,
  LightbulbIcon,
  CopyIcon,
  CheckIcon,
  LoaderCircleIcon,
  AlertCircleIcon,
} from 'lucide-react'

interface WeeklySummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: WeeklySummary | null
  isGenerating: boolean
  error: string | null
}

export function SummarySection({
  icon,
  title,
  items,
  variant,
}: {
  icon: React.ReactNode
  title: string
  items: string[]
  variant: 'shipped' | 'progress' | 'decisions'
}) {
  if (items.length === 0) return null

  const variantColors = {
    shipped: 'text-emerald-400',
    progress: 'text-amber-400',
    decisions: 'text-blue-400',
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={variantColors[variant]}>{icon}</span>
        <h3 className="text-sm font-medium text-ds-text-primary">{title}</h3>
        <Badge variant="secondary" className="text-[10px]">
          {items.length}
        </Badge>
      </div>
      <ul className="space-y-1.5 pl-6">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-sm leading-relaxed text-ds-text-secondary"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WeeklySummaryDialog({
  open,
  onOpenChange,
  summary,
  isGenerating,
  error,
}: WeeklySummaryDialogProps) {
  const { copied, handleCopy } = useCopySummary(summary)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Weekly Summary</DialogTitle>
          <DialogDescription>
            {summary
              ? <>{summary.dateRange.from} &mdash; {summary.dateRange.to}</>
              : isGenerating
              ? 'Generating your weekly summary...'
              : 'Weekly summary'}
          </DialogDescription>
        </DialogHeader>

        {isGenerating && (
          <div className="flex flex-col items-center gap-3 py-8">
            <LoaderCircleIcon className="size-6 animate-spin text-primary" />
            <p className="text-sm text-ds-text-secondary">
              Generating your weekly summary...
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {summary && !isGenerating && (
          <div className="space-y-4">
            <SummarySection
              icon={<CheckCircle2Icon className="size-4" />}
              title="What shipped"
              items={summary.shipped}
              variant="shipped"
            />

            {summary.inProgress.length > 0 && (
              <>
                <Separator />
                <SummarySection
                  icon={<ClockIcon className="size-4" />}
                  title="What's in progress"
                  items={summary.inProgress}
                  variant="progress"
                />
              </>
            )}

            {summary.keyDecisions.length > 0 && (
              <>
                <Separator />
                <SummarySection
                  icon={<LightbulbIcon className="size-4" />}
                  title="Key decisions"
                  items={summary.keyDecisions}
                  variant="decisions"
                />
              </>
            )}
          </div>
        )}

        {summary && !isGenerating && (
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy('text')}
              className="gap-1.5"
            >
              {copied === 'text' ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              {copied === 'text' ? 'Copied!' : 'Copy for Slack'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy('markdown')}
              className="gap-1.5"
            >
              {copied === 'markdown' ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              {copied === 'markdown' ? 'Copied!' : 'Copy as Markdown'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
