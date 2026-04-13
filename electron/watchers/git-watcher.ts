import type Database from 'better-sqlite3'
import { watch } from 'chokidar'
import type { FSWatcher } from 'chokidar'
import simpleGit from 'simple-git'
import { join, basename } from 'path'
import { EventStore } from '../db/events'

const FIGMA_URL_REGEX = /https?:\/\/(?:www\.)?figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/g

export class GitWatcher {
  private watchers = new Map<string, FSWatcher>()
  private events: EventStore
  private lastCommitMap = new Map<string, string>()

  constructor(private db: Database.Database) {
    this.events = new EventStore(db)
  }

  async addRepo(repoPath: string, projectId: string): Promise<void> {
    if (this.watchers.has(repoPath)) return

    // Get initial state
    const git = simpleGit(repoPath)
    try {
      const log = await git.log({ maxCount: 1 })
      if (log.latest) {
        this.lastCommitMap.set(repoPath, log.latest.hash)
      }
    } catch {
      // Empty repo or error — that's fine
    }

    // Watch .git directory for ref changes
    const gitDir = join(repoPath, '.git')
    const watcher = watch([
      join(gitDir, 'refs', 'heads'),
      join(gitDir, 'logs', 'HEAD'),
    ], {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 500 },
    })

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    watcher.on('all', () => {
      // Debounce — git operations write multiple files
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        this.processChanges(repoPath, projectId)
      }, 1000)
    })

    this.watchers.set(repoPath, watcher)
  }

  removeRepo(repoPath: string) {
    const watcher = this.watchers.get(repoPath)
    if (watcher) {
      watcher.close()
      this.watchers.delete(repoPath)
      this.lastCommitMap.delete(repoPath)
    }
  }

  stopAll() {
    for (const [path, watcher] of this.watchers) {
      watcher.close()
    }
    this.watchers.clear()
    this.lastCommitMap.clear()
  }

  private async processChanges(repoPath: string, projectId: string) {
    const git = simpleGit(repoPath)
    const repoName = basename(repoPath)

    try {
      const lastKnown = this.lastCommitMap.get(repoPath)
      const log = await git.log({ maxCount: 20 })

      if (!log.all.length) return

      // Find new commits since last known
      const newCommits = lastKnown
        ? log.all.filter((c) => {
            // Stop at the last known commit
            return c.hash !== lastKnown && new Date(c.date) > new Date(0)
          })
        : []

      // Update last known
      if (log.latest) {
        this.lastCommitMap.set(repoPath, log.latest.hash)
      }

      // If this is first run (no lastKnown), import recent commits for timeline
      const commits = lastKnown ? newCommits : log.all.slice(0, 10)

      for (const commit of commits) {
        const dedupKey = `git:${repoPath}:${commit.hash}`
        if (this.events.exists('git', 'commit', dedupKey)) continue

        // Extract Figma links from commit message
        const figmaLinks: string[] = []
        let match: RegExpExecArray | null
        const regex = new RegExp(FIGMA_URL_REGEX.source, 'g')
        while ((match = regex.exec(commit.message)) !== null) {
          figmaLinks.push(match[1]) // file key
        }

        const event = this.events.insert({
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
            branch: commit.refs || 'unknown',
            commitHash: commit.hash,
            figmaLinks,
          },
        })

        // Cross-reference with Figma events
        if (figmaLinks.length > 0) {
          this.crossReferenceFigma(event.id, figmaLinks)
        }
      }
    } catch (err) {
      console.error(`[GitWatcher] Error processing ${repoPath}:`, err)
    }
  }

  private crossReferenceFigma(gitEventId: string, figmaFileKeys: string[]) {
    for (const fileKey of figmaFileKeys) {
      // Find recent Figma events for this file
      const figmaEvents = this.db.prepare(`
        SELECT id FROM events
        WHERE source = 'figma' AND metadata LIKE ?
        ORDER BY timestamp DESC LIMIT 5
      `).all(`%"figmaFileKey":"${fileKey}"%`) as Array<{ id: string }>

      for (const fe of figmaEvents) {
        this.events.linkEvents(gitEventId, fe.id, 'figma_ref')
      }
    }
  }
}
