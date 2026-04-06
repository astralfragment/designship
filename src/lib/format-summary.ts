import type { WeeklySummary } from './ai'

export function formatSummaryAsText(summary: WeeklySummary): string {
  const lines: string[] = []
  lines.push(
    `Weekly Summary (${summary.dateRange.from} - ${summary.dateRange.to})`,
  )
  lines.push('')

  if (summary.shipped.length > 0) {
    lines.push('What shipped:')
    for (const item of summary.shipped) {
      lines.push(`  - ${item}`)
    }
    lines.push('')
  }

  if (summary.inProgress.length > 0) {
    lines.push("What's in progress:")
    for (const item of summary.inProgress) {
      lines.push(`  - ${item}`)
    }
    lines.push('')
  }

  if (summary.keyDecisions.length > 0) {
    lines.push('Key decisions:')
    for (const item of summary.keyDecisions) {
      lines.push(`  - ${item}`)
    }
  }

  return lines.join('\n')
}

export function formatSummaryAsMarkdown(summary: WeeklySummary): string {
  const lines: string[] = []
  lines.push(
    `## Weekly Summary (${summary.dateRange.from} \u2014 ${summary.dateRange.to})`,
  )
  lines.push('')

  if (summary.shipped.length > 0) {
    lines.push('### What shipped')
    for (const item of summary.shipped) {
      lines.push(`- ${item}`)
    }
    lines.push('')
  }

  if (summary.inProgress.length > 0) {
    lines.push("### What's in progress")
    for (const item of summary.inProgress) {
      lines.push(`- ${item}`)
    }
    lines.push('')
  }

  if (summary.keyDecisions.length > 0) {
    lines.push('### Key decisions')
    for (const item of summary.keyDecisions) {
      lines.push(`- ${item}`)
    }
  }

  return lines.join('\n')
}
