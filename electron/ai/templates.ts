import type { DSEvent, SummaryType } from '../../shared/ipc-types'

/** Generate a summary using templates — no AI, zero cost */
export function generateTemplateSummary(events: DSEvent[], type: SummaryType): string {
  if (events.length === 0) {
    return '_No activity recorded for this period._'
  }

  switch (type) {
    case 'standup':
      return generateStandup(events)
    case 'weekly':
      return generateWeeklyDigest(events)
    case 'changelog':
      return generateChangelog(events)
    case 'adhoc':
      return generateAdhoc(events)
  }
}

function generateStandup(events: DSEvent[]): string {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const recent = events.filter((e) => new Date(e.timestamp) >= yesterday)
  const figma = recent.filter((e) => e.source === 'figma')
  const git = recent.filter((e) => e.source === 'git')

  const lines: string[] = ['## Standup', '']

  if (git.length > 0 || figma.length > 0) {
    lines.push('**Yesterday:**')
    for (const e of figma) {
      lines.push(`- Design: ${e.title}${e.actor ? ` (${e.actor})` : ''}`)
    }
    for (const e of git) {
      lines.push(`- Code: ${e.title}${e.actor ? ` (${e.actor})` : ''}`)
    }
  } else {
    lines.push('_No recorded activity._')
  }

  lines.push('', '**Today:**', '- _(add your plan)_')

  return lines.join('\n')
}

function generateWeeklyDigest(events: DSEvent[]): string {
  const figma = events.filter((e) => e.source === 'figma')
  const git = events.filter((e) => e.source === 'git')

  // Group by day
  const byDay = groupByDay(events)

  const lines: string[] = ['## Weekly Digest', '']

  // Summary stats
  lines.push(`**${events.length} updates** this week — ${figma.length} design, ${git.length} code`, '')

  // Group by feature area (naive: group by project)
  const byProject = groupBy(events, (e) => e.project_id ?? 'unknown')
  for (const [projectId, projectEvents] of Object.entries(byProject)) {
    const projectFigma = projectEvents.filter((e) => e.source === 'figma')
    const projectGit = projectEvents.filter((e) => e.source === 'git')

    lines.push(`### ${getProjectLabel(projectEvents)}`)
    if (projectFigma.length > 0) {
      lines.push(`- **Design:** ${projectFigma.length} update${projectFigma.length > 1 ? 's' : ''}`)
      for (const e of projectFigma.slice(0, 5)) {
        lines.push(`  - ${e.title}`)
      }
    }
    if (projectGit.length > 0) {
      lines.push(`- **Code:** ${projectGit.length} commit${projectGit.length > 1 ? 's' : ''}`)
      for (const e of projectGit.slice(0, 5)) {
        lines.push(`  - ${e.title}`)
      }
    }
    lines.push('')
  }

  // Cross-references
  const linked = events.filter(
    (e) => e.metadata && (e.metadata as Record<string, unknown>).figmaLinks,
  )
  if (linked.length > 0) {
    lines.push('### Design → Code Connections')
    for (const e of linked) {
      lines.push(`- ${e.title} → linked to Figma designs`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function generateChangelog(events: DSEvent[]): string {
  const lines: string[] = ['## Changelog', '']

  const figma = events.filter((e) => e.source === 'figma')
  const git = events.filter((e) => e.source === 'git')

  if (figma.length > 0) {
    lines.push('### Design Changes')
    for (const e of figma) {
      const date = formatDate(e.timestamp)
      lines.push(`- **${e.title}** — ${date}${e.actor ? ` by ${e.actor}` : ''}`)
    }
    lines.push('')
  }

  if (git.length > 0) {
    lines.push('### Code Changes')
    for (const e of git) {
      const date = formatDate(e.timestamp)
      lines.push(`- ${e.title} — ${date}${e.actor ? ` by ${e.actor}` : ''}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function generateAdhoc(events: DSEvent[]): string {
  const lines: string[] = ['## Activity Summary', '']

  const byDay = groupByDay(events)
  for (const [day, dayEvents] of Object.entries(byDay)) {
    lines.push(`### ${day}`)
    for (const e of dayEvents) {
      const icon = e.source === 'figma' ? '🎨' : '💻'
      lines.push(`- ${icon} ${e.title}${e.actor ? ` (${e.actor})` : ''}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// --- Helpers ---

function groupByDay(events: DSEvent[]): Record<string, DSEvent[]> {
  const groups: Record<string, DSEvent[]> = {}
  for (const e of events) {
    const day = e.timestamp.slice(0, 10) // YYYY-MM-DD
    if (!groups[day]) groups[day] = []
    groups[day].push(e)
  }
  return groups
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const item of items) {
    const key = keyFn(item)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

function getProjectLabel(events: DSEvent[]): string {
  const meta = events[0]?.metadata as Record<string, unknown> | null
  return (meta?.figmaFileName as string) ?? (meta?.repoName as string) ?? 'Activity'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
