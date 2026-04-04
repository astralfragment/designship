import { createFileRoute } from '@tanstack/react-router'
import { Timeline } from '../../components/timeline'
import type { TimelineEvent } from '../../components/timeline'
import { useRepos, useMergedPRs } from '@/hooks/use-github'
import { useAuth } from '@/lib/auth'
import type { GitHubPR } from '@/lib/github'

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
})

function prToTimelineEvent(pr: GitHubPR): TimelineEvent {
  return {
    id: `pr-${pr.id}`,
    type: 'pr_merged',
    title: pr.title,
    description: pr.body,
    timestamp: pr.merged_at ?? pr.updated_at,
    url: pr.html_url,
    author: {
      name: pr.user.login,
      avatarUrl: pr.user.avatar_url,
    },
    metadata: {
      type: 'pr_merged',
      number: pr.number,
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      reviewCount: pr.review_comments,
      filesChanged: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      labels: pr.labels,
    },
  }
}

function HomePage() {
  const { githubToken } = useAuth()
  const { data: repos, isLoading: reposLoading } = useRepos()

  const topRepo = repos?.[0]
  const [owner, repo] = topRepo?.full_name.split('/') ?? []

  const { data: prs, isLoading: prsLoading } = useMergedPRs(owner ?? '', repo ?? '')

  const events: TimelineEvent[] = (prs ?? []).map(prToTimelineEvent)

  const loading = !githubToken || reposLoading || prsLoading

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ds-text-primary">
          Timeline
        </h1>
        <p className="mt-1 text-sm text-ds-text-secondary">
          Your recent development activity at a glance.
        </p>
      </div>

      <Timeline events={events} loading={loading} />
    </div>
  )
}
