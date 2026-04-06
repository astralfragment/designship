import { Skeleton } from '@/components/ui/skeleton'

export function TimelineEntrySkeleton() {
  return (
    <div className="flex gap-4">
      {/* Dot */}
      <div className="flex flex-col items-center">
        <Skeleton className="size-8 rounded-full" />
        <div className="w-px flex-1 bg-ds-timeline-connector" />
      </div>

      {/* Card */}
      <div className="mb-6 flex-1 rounded-lg border border-border/40 bg-card p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="mt-2 h-4 w-3/4" />
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="mt-3 flex gap-1.5">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function TimelineSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="animate-ds-fade-in">
      {Array.from({ length: count }, (_, i) => (
        <TimelineEntrySkeleton key={i} />
      ))}
    </div>
  )
}
