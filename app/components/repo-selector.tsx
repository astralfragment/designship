import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDownIcon, GitBranchIcon, LockIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { GitHubRepo } from '@/lib/github'

interface RepoSelectorProps {
  repos: GitHubRepo[]
  selectedRepo: GitHubRepo | null
  onSelect: (repo: GitHubRepo) => void
  loading?: boolean
}

export function RepoSelector({
  repos,
  selectedRepo,
  onSelect,
  loading,
}: RepoSelectorProps) {
  if (loading) {
    return <Skeleton className="h-8 w-48 rounded-lg" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="default" className="min-h-[44px] gap-2 font-normal sm:min-h-0" aria-label="Select repository" />
        }
      >
        <GitBranchIcon className="size-3.5 text-ds-text-tertiary" />
        <span className="max-w-[180px] truncate text-sm">
          {selectedRepo?.full_name ?? 'Select a repo'}
        </span>
        <ChevronsUpDownIcon className="size-3 text-ds-text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="max-h-72 w-64 overflow-y-auto">
        <DropdownMenuLabel>Your repositories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {repos.map((repo) => (
          <DropdownMenuItem
            key={repo.id}
            onClick={() => onSelect(repo)}
            className={cn(
              selectedRepo?.id === repo.id && 'bg-accent',
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {repo.private && <LockIcon className="size-3 shrink-0 text-ds-text-tertiary" />}
              <span className="truncate">{repo.full_name}</span>
            </div>
            {repo.language && (
              <span className="ml-auto shrink-0 text-[10px] text-ds-text-tertiary">
                {repo.language}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        {repos.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-ds-text-tertiary">
            No repositories found
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
