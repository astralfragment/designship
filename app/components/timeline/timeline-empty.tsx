import { GitBranchIcon } from 'lucide-react'

export function TimelineEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-ds-fade-in">
      <div className="flex size-12 items-center justify-center rounded-full bg-ds-surface-2">
        <GitBranchIcon className="size-5 text-ds-text-tertiary" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-ds-text-primary">
        No activity yet
      </h3>
      <p className="mt-1 max-w-[240px] text-xs text-ds-text-secondary">
        Connect a repo to see your development activity appear here.
      </p>
    </div>
  )
}
