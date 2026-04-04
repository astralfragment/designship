import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSummaries, useDeleteSummary } from '@/hooks/use-summaries'
import { storedToWeeklySummary } from '@/lib/summaries'
import type { StoredSummary } from '@/lib/summaries'
import type { WeeklySummary } from '@/lib/ai'
import { formatSummaryAsText, formatSummaryAsMarkdown } from '@/lib/format-summary'
import { useToast } from '../../components/toast'
import { ErrorBoundary } from '../../components/error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  FileTextIcon,
  CopyIcon,
  CheckIcon,
  Trash2Icon,
  MoreVerticalIcon,
  CheckCircle2Icon,
  ClockIcon,
  LightbulbIcon,
  CalendarIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/summaries')({
  component: SummariesPage,
})

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function SummaryCard({
  stored,
  onView,
  onDelete,
}: {
  stored: StoredSummary
  onView: () => void
  onDelete: () => void
}) {
  const [copied, setCopied] = useState<'text' | 'markdown' | null>(null)
  const { toast } = useToast()
  const summary = storedToWeeklySummary(stored)

  const handleCopy = useCallback(
    async (format: 'text' | 'markdown', e: React.MouseEvent) => {
      e.stopPropagation()
      const content =
        format === 'markdown'
          ? formatSummaryAsMarkdown(summary)
          : formatSummaryAsText(summary)
      try {
        await navigator.clipboard.writeText(content)
        setCopied(format)
        toast(format === 'markdown' ? 'Copied as Markdown' : 'Copied for Slack', 'success')
        setTimeout(() => setCopied(null), 2000)
      } catch {
        toast('Failed to copy to clipboard', 'error')
      }
    },
    [summary, toast],
  )

  return (
    <Card
      className="group cursor-pointer transition-colors hover:bg-ds-surface-1/50"
      onClick={onView}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-sm font-medium text-ds-text-primary">
            {stored.date_from} &mdash; {stored.date_to}
          </CardTitle>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-ds-text-tertiary">
              <CalendarIcon className="mr-1 inline size-3" />
              {formatRelativeDate(stored.generated_at)}
            </span>
            {stored.repo_name && (
              <Badge variant="secondary" className="text-[10px]">
                {stored.repo_name}
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="rounded-md p-1 opacity-0 outline-none transition-opacity hover:bg-accent focus-visible:opacity-100 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <MoreVerticalIcon className="size-4 text-ds-text-tertiary" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleCopy('text', e)}>
              <CopyIcon className="size-3.5" />
              {copied === 'text' ? 'Copied!' : 'Copy for Slack'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleCopy('markdown', e)}>
              <CopyIcon className="size-3.5" />
              {copied === 'markdown' ? 'Copied!' : 'Copy as Markdown'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2Icon className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-3 text-xs text-ds-text-secondary">
          {stored.shipped.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2Icon className="size-3 text-emerald-400" />
              {stored.shipped.length} shipped
            </span>
          )}
          {stored.in_progress.length > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3 text-amber-400" />
              {stored.in_progress.length} in progress
            </span>
          )}
          {stored.key_decisions.length > 0 && (
            <span className="flex items-center gap-1">
              <LightbulbIcon className="size-3 text-blue-400" />
              {stored.key_decisions.length} decisions
            </span>
          )}
        </div>
        {stored.shipped.length > 0 && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ds-text-tertiary">
            {stored.shipped.slice(0, 2).join(' \u2022 ')}
            {stored.shipped.length > 2 && ` \u2022 +${stored.shipped.length - 2} more`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryDetailDialog({
  stored,
  open,
  onOpenChange,
}: {
  stored: StoredSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState<'text' | 'markdown' | null>(null)
  const { toast } = useToast()

  if (!stored) return null

  const summary = storedToWeeklySummary(stored)

  const handleCopy = async (format: 'text' | 'markdown') => {
    const content =
      format === 'markdown'
        ? formatSummaryAsMarkdown(summary)
        : formatSummaryAsText(summary)
    try {
      await navigator.clipboard.writeText(content)
      setCopied(format)
      toast(format === 'markdown' ? 'Copied as Markdown' : 'Copied for Slack', 'success')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast('Failed to copy to clipboard', 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Weekly Summary</DialogTitle>
          <DialogDescription>
            {stored.date_from} &mdash; {stored.date_to}
            {stored.repo_name && ` \u00b7 ${stored.repo_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {summary.shipped.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-emerald-400" />
                <h3 className="text-sm font-medium text-ds-text-primary">
                  What shipped
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  {summary.shipped.length}
                </Badge>
              </div>
              <ul className="space-y-1.5 pl-6">
                {summary.shipped.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-ds-text-secondary"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.inProgress.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ClockIcon className="size-4 text-amber-400" />
                  <h3 className="text-sm font-medium text-ds-text-primary">
                    What's in progress
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {summary.inProgress.length}
                  </Badge>
                </div>
                <ul className="space-y-1.5 pl-6">
                  {summary.inProgress.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm leading-relaxed text-ds-text-secondary"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {summary.keyDecisions.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <LightbulbIcon className="size-4 text-blue-400" />
                  <h3 className="text-sm font-medium text-ds-text-primary">
                    Key decisions
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {summary.keyDecisions.length}
                  </Badge>
                </div>
                <ul className="space-y-1.5 pl-6">
                  {summary.keyDecisions.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm leading-relaxed text-ds-text-secondary"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

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
      </DialogContent>
    </Dialog>
  )
}

function SummariesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-1 h-3 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SummariesPage() {
  const { data: summaries, isLoading, error } = useSummaries()
  const deleteM = useDeleteSummary()
  const { toast } = useToast()
  const [viewingSummary, setViewingSummary] = useState<StoredSummary | null>(
    null,
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteM.mutate(id, {
        onSuccess: () => toast('Summary deleted', 'success'),
        onError: () => toast('Failed to delete summary', 'error'),
      })
    },
    [deleteM, toast],
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ds-text-primary">
          Summaries
        </h1>
        <p className="mt-1 text-sm text-ds-text-secondary">
          Your generated weekly summaries, ready to share.
        </p>
      </div>

      {isLoading && <SummariesSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 py-16">
          <p className="text-sm font-medium text-destructive">
            Failed to load summaries
          </p>
          <p className="mt-1 text-xs text-ds-text-tertiary">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
        </div>
      )}

      {!isLoading && !error && summaries && summaries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16">
          <FileTextIcon className="mb-3 size-8 text-ds-text-tertiary" />
          <p className="text-sm font-medium text-ds-text-secondary">
            No summaries yet
          </p>
          <p className="mt-1 text-xs text-ds-text-tertiary">
            Generate a weekly summary from your timeline to see it here.
          </p>
        </div>
      )}

      {!isLoading && !error && summaries && summaries.length > 0 && (
        <ErrorBoundary>
          <div className="space-y-3">
            {summaries.map((s) => (
              <SummaryCard
                key={s.id}
                stored={s}
                onView={() => setViewingSummary(s)}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        </ErrorBoundary>
      )}

      <SummaryDetailDialog
        stored={viewingSummary}
        open={viewingSummary !== null}
        onOpenChange={(open) => {
          if (!open) setViewingSummary(null)
        }}
      />
    </div>
  )
}
