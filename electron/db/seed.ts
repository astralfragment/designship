import type Database from 'better-sqlite3'
import simpleGit from 'simple-git'
import { basename, join } from 'path'
import { readdirSync, statSync, existsSync } from 'fs'
import { ulid } from 'ulid'
import { EventStore } from './events'

const AGENT_PATTERNS = [
  /Co-Authored-By:.*Claude/i,
  /Co-Authored-By:.*Cursor/i,
  /Co-Authored-By:.*Copilot/i,
  /Co-Authored-By:.*anthropic/i,
  /\[bot\]/i,
  /^(fix|feat|refactor|chore|docs|style|test)(\(.+\))?!?:.*generated/i,
]

const SCAN_DIRS = [
  process.cwd(),
  join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'Desktop'),
  join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'Documents'),
  join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'Projects'),
  join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'repos'),
  join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'dev'),
  join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'code'),
  join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'src'),
]

/**
 * Auto-discover Git repos and import commits. Zero config.
 * Scans common dev directories for repos with recent activity.
 */
export async function seedOnStartup(db: Database.Database) {
  const events = new EventStore(db)

  console.log('[AutoDiscover] Scanning for Git repos...')

  const discoveredRepos = discoverGitRepos()
  console.log(`[AutoDiscover] Found ${discoveredRepos.length} Git repos`)

  for (const repoPath of discoveredRepos) {
    await importRepo(db, events, repoPath)
  }
}

function discoverGitRepos(): string[] {
  const repos: string[] = []
  const seen = new Set<string>()

  for (const dir of SCAN_DIRS) {
    if (!dir || !existsSync(dir)) continue
    findRepos(dir, repos, seen, 0, 2) // max depth 2
  }

  return repos
}

function findRepos(dir: string, repos: string[], seen: Set<string>, depth: number, maxDepth: number) {
  if (depth > maxDepth || seen.has(dir)) return
  seen.add(dir)

  try {
    // Is this dir itself a git repo?
    if (existsSync(join(dir, '.git'))) {
      repos.push(dir)
      return // Don't recurse into git repos
    }

    if (depth >= maxDepth) return

    // Scan children
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      findRepos(join(dir, entry.name), repos, seen, depth + 1, maxDepth)
    }
  } catch {
    // Permission denied etc — skip
  }
}

async function importRepo(db: Database.Database, events: EventStore, repoPath: string): Promise<void> {
  try {
    const git = simpleGit(repoPath)
    const isRepo = await git.checkIsRepo()
    if (!isRepo) return

    const repoName = basename(repoPath)
    const remotes = await git.getRemotes(true)
    const remoteUrl = remotes[0]?.refs?.fetch ?? null

    // Register project if not exists
    const existing = db.prepare(
      "SELECT id FROM projects WHERE type = 'git_repo' AND identifier = ?"
    ).get(repoPath) as { id: string } | undefined

    let projectId: string
    if (existing) {
      projectId = existing.id
    } else {
      projectId = ulid()
      db.prepare(`
        INSERT INTO projects (id, name, type, identifier, config)
        VALUES (?, ?, 'git_repo', ?, ?)
      `).run(projectId, repoName, repoPath, JSON.stringify({ remoteUrl, autoDiscovered: true }))
    }

    // Check how many events we already have for this repo
    const existingEvents = db.prepare(
      "SELECT COUNT(*) as count FROM events WHERE project_id = ? AND source = 'git'"
    ).get(projectId) as { count: number }

    if (existingEvents.count >= 20) return // Already imported enough

    // Import recent commits
    const log = await git.log({ maxCount: 30 })
    let imported = 0

    for (const commit of log.all) {
      const dedupKey = `git:${repoPath}:${commit.hash}`
      if (events.exists('git', 'commit', dedupKey)) continue

      const isAgent = isAgentAuthored(commit.message, commit.author_name)

      events.insert({
        timestamp: commit.date,
        source: 'git',
        type: 'commit',
        title: commit.message.split('\n')[0].slice(0, 120),
        body: commit.message,
        actor: commit.author_name,
        project_id: projectId,
        metadata: {
          dedupKey,
          repoPath,
          repoName,
          branch: commit.refs || '',
          commitHash: commit.hash,
          remoteUrl,
          isAgent,
          agentName: isAgent ? detectAgentName(commit.message) : null,
        },
      })
      imported++
    }

    if (imported > 0) {
      console.log(`[AutoDiscover] ${repoName}: imported ${imported} commits${imported > 0 ? ` (${log.all.filter(c => isAgentAuthored(c.message, c.author_name)).length} by agents)` : ''}`)
    }
  } catch {
    // Not a valid repo — skip silently
  }
}

function isAgentAuthored(message: string, author: string): boolean {
  // Check author name
  const agentAuthors = ['claude', 'cursor', 'copilot', 'github-actions', 'dependabot', 'renovate']
  if (agentAuthors.some(a => author.toLowerCase().includes(a))) return true

  // Check message patterns
  return AGENT_PATTERNS.some(p => p.test(message))
}

function detectAgentName(message: string): string {
  if (/claude/i.test(message)) return 'Claude'
  if (/cursor/i.test(message)) return 'Cursor'
  if (/copilot/i.test(message)) return 'Copilot'
  if (/dependabot/i.test(message)) return 'Dependabot'
  if (/renovate/i.test(message)) return 'Renovate'
  return 'AI Agent'
}
