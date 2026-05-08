import type Database from 'better-sqlite3'
import { ulid } from 'ulid'
import type {
  Fragment,
  Spec,
  SpecStatus,
  SpecUpdateInput,
} from '../../shared/ipc-types'

interface RawSpec {
  id: string
  project_id: string
  title: string
  content_md: string
  status: string
  fragment_ids: string
  created_at: string
  updated_at: string
}

function mapSpec(row: RawSpec): Spec {
  let fragment_ids: string[] = []
  try {
    fragment_ids = JSON.parse(row.fragment_ids)
  } catch {
    fragment_ids = []
  }
  return {
    ...row,
    status: row.status as SpecStatus,
    fragment_ids,
  }
}

export class SpecStore {
  constructor(private db: Database.Database) {}

  insert(input: {
    project_id: string
    title: string
    content_md: string
    fragment_ids: string[]
    status?: SpecStatus
  }): Spec {
    const id = ulid()
    this.db
      .prepare(
        `INSERT INTO specs (id, project_id, title, content_md, status, fragment_ids)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.project_id,
        input.title,
        input.content_md,
        input.status ?? 'draft',
        JSON.stringify(input.fragment_ids),
      )
    return this.get(id)!
  }

  get(id: string): Spec | null {
    const row = this.db.prepare('SELECT * FROM specs WHERE id = ?').get(id) as
      | RawSpec
      | undefined
    return row ? mapSpec(row) : null
  }

  list(projectId: string): Spec[] {
    const rows = this.db
      .prepare(`SELECT * FROM specs WHERE project_id = ? ORDER BY updated_at DESC`)
      .all(projectId) as RawSpec[]
    return rows.map(mapSpec)
  }

  update(id: string, patch: SpecUpdateInput): Spec {
    const existing = this.get(id)
    if (!existing) throw new Error(`Spec ${id} not found`)

    this.db
      .prepare(
        `UPDATE specs
         SET title = ?, content_md = ?, status = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(
        patch.title ?? existing.title,
        patch.content_md ?? existing.content_md,
        patch.status ?? existing.status,
        id,
      )
    return this.get(id)!
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM specs WHERE id = ?').run(id)
  }
}

// ===== Template spec drafter — works without AI =====

export function draftSpecMarkdown(
  fragments: Fragment[],
  titleOverride?: string,
): { title: string; content: string } {
  if (fragments.length === 0) {
    return {
      title: titleOverride ?? 'Untitled spec',
      content:
        '_No fragments selected. Capture some context and try again._',
    }
  }

  const grouped: Record<string, Fragment[]> = {}
  for (const f of fragments) {
    if (!grouped[f.type]) grouped[f.type] = []
    grouped[f.type].push(f)
  }

  const allTags = new Set<string>()
  for (const f of fragments) {
    for (const t of f.tags) allTags.add(t)
  }

  const title =
    titleOverride ??
    pickTitle(grouped['note']) ??
    pickTitle(grouped['requirement']) ??
    pickTitle(fragments) ??
    'Untitled spec'

  const lines: string[] = []
  lines.push(`# ${title}`, '')

  if (allTags.size > 0) {
    lines.push(`**Context:** ${[...allTags].map((t) => `\`${t}\``).join(', ')}`, '')
  }

  lines.push('## Problem', '')
  const problem =
    pickContent(grouped['feedback']) ??
    pickContent(grouped['note']) ??
    'TODO — describe the problem this spec addresses.'
  lines.push(problem, '')

  lines.push('## Background', '')
  const background = [
    ...(grouped['feedback'] ?? []),
    ...(grouped['note'] ?? []),
  ]
  if (background.length > 0) {
    for (const f of background) {
      lines.push(`- **${f.title}**${f.source ? ` _(${f.source})_` : ''}`)
      if (f.content.trim()) {
        const indented = f.content
          .trim()
          .split('\n')
          .map((l) => `  ${l}`)
          .join('\n')
        lines.push(indented)
      }
    }
  } else {
    lines.push('_No background fragments captured yet._')
  }
  lines.push('')

  lines.push('## Goals', '')
  lines.push('- TODO — list the desired outcomes.', '')

  lines.push('## Non-goals', '')
  lines.push('- TODO — list what is explicitly out of scope.', '')

  lines.push('## Requirements', '')
  const requirements = grouped['requirement'] ?? []
  if (requirements.length > 0) {
    for (const f of requirements) {
      lines.push(`- **${f.title}**`)
      if (f.content.trim()) {
        const indented = f.content
          .trim()
          .split('\n')
          .map((l) => `  ${l}`)
          .join('\n')
        lines.push(indented)
      }
    }
  } else {
    lines.push('_No requirements captured yet — add fragments of type `requirement`._')
  }
  lines.push('')

  lines.push('## Acceptance criteria', '')
  if (requirements.length > 0) {
    for (const f of requirements) {
      const headline = f.title.replace(/\.$/, '')
      lines.push(`- [ ] **${headline}**`)
      lines.push(`  - Given the user is using the product`)
      lines.push(`  - When they ${headline.toLowerCase()}`)
      lines.push(`  - Then the system behaves as described in the requirement above`)
    }
  } else {
    lines.push('- [ ] TODO — derive acceptance criteria once requirements are captured.')
  }
  lines.push('')

  lines.push('## Open questions', '')
  const questions = grouped['question'] ?? []
  if (questions.length > 0) {
    for (const f of questions) {
      lines.push(`- ${f.title}`)
      if (f.content.trim()) lines.push(`  > ${f.content.trim().split('\n').join('\n  > ')}`)
    }
  } else {
    lines.push('_None captured._')
  }
  lines.push('')

  lines.push('## QA notes', '')
  const qa = grouped['qa'] ?? []
  if (qa.length > 0) {
    for (const f of qa) {
      lines.push(`- **${f.title}**`)
      if (f.content.trim()) {
        const indented = f.content
          .trim()
          .split('\n')
          .map((l) => `  ${l}`)
          .join('\n')
        lines.push(indented)
      }
    }
  } else {
    lines.push('_No QA findings captured._')
  }
  lines.push('')

  lines.push('## Decision history', '')
  const decisions = grouped['decision'] ?? []
  if (decisions.length > 0) {
    for (const f of decisions) {
      const date = f.created_at.slice(0, 10)
      lines.push(`- _${date}_ — **${f.title}**`)
      if (f.content.trim()) {
        const indented = f.content
          .trim()
          .split('\n')
          .map((l) => `  ${l}`)
          .join('\n')
        lines.push(indented)
      }
    }
  } else {
    lines.push('_No decisions logged yet._')
  }
  lines.push('')

  lines.push('## Source fragments', '')
  for (const f of fragments) {
    lines.push(`- [\`${f.type}\`] ${f.title}`)
  }

  return { title, content: lines.join('\n') }
}

function pickTitle(items?: Fragment[]): string | null {
  if (!items || items.length === 0) return null
  return items[0].title
}

function pickContent(items?: Fragment[]): string | null {
  if (!items || items.length === 0) return null
  for (const item of items) {
    if (item.content.trim()) return item.content.trim()
  }
  return null
}
