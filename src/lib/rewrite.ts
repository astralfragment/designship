const PREFIXES = /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert|wip)(\(.+?\))?[:\s!]+/i

const ABBREVIATIONS: Record<string, string> = {
  'impl': 'implement',
  'init': 'initialize',
  'config': 'configuration',
  'auth': 'authentication',
  'btn': 'button',
  'nav': 'navigation',
  'msg': 'message',
  'err': 'error',
  'req': 'request',
  'res': 'response',
  'env': 'environment',
  'db': 'database',
  'api': 'API',
  'ui': 'UI',
  'ux': 'UX',
  'perf': 'performance',
  'deps': 'dependencies',
  'pkg': 'package',
  'repo': 'repository',
  'devtools': 'developer tools',
  'middleware': 'middleware',
  'e2e': 'end-to-end',
}

function titleCase(str: string): string {
  return str
    .split(' ')
    .map((word, i) => {
      if (i > 0 && ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function expandAbbreviations(str: string): string {
  return str.split(/\b/).map(word => {
    const lower = word.toLowerCase()
    return ABBREVIATIONS[lower] || word
  }).join('')
}

function humanizeAction(title: string): string {
  const lower = title.toLowerCase()
  if (lower.startsWith('add')) return title.replace(/^add/i, 'Added')
  if (lower.startsWith('fix')) return title.replace(/^fix/i, 'Fixed')
  if (lower.startsWith('update')) return title.replace(/^update/i, 'Updated')
  if (lower.startsWith('remove')) return title.replace(/^remove/i, 'Removed')
  if (lower.startsWith('refactor')) return title.replace(/^refactor/i, 'Improved')
  if (lower.startsWith('implement')) return title.replace(/^implement/i, 'Implemented')
  if (lower.startsWith('improve')) return title.replace(/^improve/i, 'Improved')
  if (lower.startsWith('create')) return title.replace(/^create/i, 'Created')
  if (lower.startsWith('move')) return title.replace(/^move/i, 'Moved')
  if (lower.startsWith('rename')) return title.replace(/^rename/i, 'Renamed')
  if (lower.startsWith('delete')) return title.replace(/^delete/i, 'Deleted')
  if (lower.startsWith('migrate')) return title.replace(/^migrate/i, 'Migrated')
  if (lower.startsWith('upgrade')) return title.replace(/^upgrade/i, 'Upgraded')
  return title
}

export function rewriteForStakeholder(title: string): string {
  let cleaned = title.replace(PREFIXES, '').trim()
  cleaned = cleaned.replace(/[_-]/g, ' ')
  cleaned = expandAbbreviations(cleaned)
  cleaned = humanizeAction(cleaned)
  cleaned = titleCase(cleaned)
  if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    // leave as-is
  }
  return cleaned
}

export interface MergedPR {
  id: number
  title: string
  repo: string
  mergedAt: string
  author: string
  authorAvatar: string
  branch: string
  commitCount: number
  url: string
}

function categorize(title: string): 'shipped' | 'fixed' | 'improved' {
  const lower = title.toLowerCase()
  if (lower.includes('fix') || lower.includes('bug') || lower.includes('patch') || lower.includes('hotfix')) return 'fixed'
  if (lower.includes('refactor') || lower.includes('improve') || lower.includes('update') || lower.includes('optim') || lower.includes('perf')) return 'improved'
  return 'shipped'
}

export function generateWeeklySummary(prs: MergedPR[]): string {
  if (prs.length === 0) return 'No pull requests were merged this week.'

  const shipped: string[] = []
  const fixed: string[] = []
  const improved: string[] = []

  for (const pr of prs) {
    const friendly = rewriteForStakeholder(pr.title)
    const cat = categorize(pr.title)
    if (cat === 'fixed') fixed.push(friendly)
    else if (cat === 'improved') improved.push(friendly)
    else shipped.push(friendly)
  }

  const parts: string[] = []
  if (shipped.length > 0) parts.push(`shipped ${shipped.slice(0, 3).join(', ')}`)
  if (fixed.length > 0) parts.push(`fixed ${fixed.slice(0, 3).join(', ')}`)
  if (improved.length > 0) parts.push(`improved ${improved.slice(0, 3).join(', ')}`)

  const summary = `This week I ${parts.join(', ')}.`

  const highlights = prs
    .slice(0, 5)
    .map(pr => `- ${rewriteForStakeholder(pr.title)} (${pr.repo})`)
    .join('\n')

  return `${summary}\n\nKey highlights:\n${highlights}\n\nTotal: ${prs.length} PR${prs.length !== 1 ? 's' : ''} merged across ${new Set(prs.map(p => p.repo)).size} repositories.`
}
