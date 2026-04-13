import type Database from 'better-sqlite3'
import { FigmaWatcher } from './figma-watcher'
import { GitWatcher } from './git-watcher'

let _instance: WatcherManager | null = null

export class WatcherManager {
  private figmaWatcher: FigmaWatcher
  private gitWatcher: GitWatcher

  constructor(private db: Database.Database) {
    this.figmaWatcher = new FigmaWatcher(db)
    this.gitWatcher = new GitWatcher(db)
    _instance = this
  }

  start() {
    this.figmaWatcher.start()

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
  }

  /** Called when user saves Figma token — trigger immediate re-discovery */
  onFigmaTokenChanged() {
    this.figmaWatcher.onTokenChanged()
  }

  getFigmaWatcher() { return this.figmaWatcher }
  getGitWatcher() { return this.gitWatcher }

  static getInstance(): WatcherManager | null { return _instance }
}
