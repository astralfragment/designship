import type Database from 'better-sqlite3'
import { FigmaWatcher } from './figma-watcher'
import { GitWatcher } from './git-watcher'

export class WatcherManager {
  private figmaWatcher: FigmaWatcher
  private gitWatcher: GitWatcher

  constructor(private db: Database.Database) {
    this.figmaWatcher = new FigmaWatcher(db, () => this.getFigmaToken())
    this.gitWatcher = new GitWatcher(db)
  }

  start() {
    // Start Figma polling
    this.figmaWatcher.start()

    // Start watching all registered Git repos
    const gitProjects = this.db
      .prepare("SELECT * FROM projects WHERE type = 'git_repo'")
      .all() as Array<{ id: string; identifier: string }>

    for (const project of gitProjects) {
      this.gitWatcher.addRepo(project.identifier, project.id)
    }

    console.log('[WatcherManager] Started watching', gitProjects.length, 'Git repos')
  }

  stop() {
    this.figmaWatcher.stop()
    this.gitWatcher.stopAll()
    console.log('[WatcherManager] All watchers stopped')
  }

  getFigmaWatcher() { return this.figmaWatcher }
  getGitWatcher() { return this.gitWatcher }

  private getFigmaToken(): string | null {
    const row = this.db
      .prepare("SELECT value FROM app_config WHERE key = 'figma_token'")
      .get() as { value: string } | undefined
    return row?.value ?? null
  }
}
