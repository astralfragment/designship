import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSummaries, useDeleteSummary } from '@/hooks/use-summaries'
import { storedToWeeklySummary } from '@/lib/summaries'
import { formatRelativeDate } from '../../components/timeline'
import type { StoredSummary } from '@/lib/summaries'
import { useCopySummary } from '@/hooks/use-copy-summary'
import { useToast } from '../../components/toast'
import { SummarySection } from '../../components/weekly-summary-dialog'
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

function SummaryCard({
  stored,
  onView,
  onDelete,
}: {
  stored: StoredSummary
  onView: () => void
  onDelete: () => void
}) {
  const summary = storedToWeeklySummary(stored)
  const { copied, handleCopy } = useCopySummary(summary)

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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopy('text') }}>
              <CopyIcon className="size-3.5" />
              {copied === 'text' ? 'Copied!' : 'Copy for Slack'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopy('markdown') }}>
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
  const summaryOrNull = stored ? storedToWeeklySummary(stored) : null
  const { copied, handleCopy } = useCopySummary(summaryOrNull)

  if (!stored || !summaryOrNull) return null

  const summary = summaryOrNull

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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id)
    },
    [],
  )

  const confirmDelete = useCallback(() => {
    if (!deletingId) return
    deleteM.mutate(deletingId, {
      onSuccess: () => {
        toast('Summary deleted', 'success')
        setDeletingId(null)
      },
      onError: () => {
        toast('Failed to delete summary', 'error')
        setDeletingId(null)
      },
    })
  }, [deletingId, deleteM, toast])

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

      {/* Delete confirmation dialog */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete summary?</DialogTitle>
            <DialogDescription>
              This will permanently remove this weekly summary. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleteM.isPending}>
              {deleteM.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
