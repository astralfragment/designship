import { join } from 'path'
import { existsSync, copyFileSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import Database from 'better-sqlite3'

/**
 * Auto-discover Figma file keys from local browser history.
 * Zero config — user doesn't need to paste URLs.
 */
export function discoverFigmaFilesFromBrowsers(): Array<{ key: string; url: string }> {
  const files = new Map<string, string>() // key -> url

  // Chrome profiles to scan
  const home = process.env.USERPROFILE ?? process.env.HOME ?? ''
  const chromeProfiles = [
    join(home, 'AppData/Local/Google/Chrome/User Data/Default/History'),
    join(home, 'AppData/Local/Google/Chrome/User Data/Profile 1/History'),
    join(home, 'AppData/Local/Google/Chrome/User Data/Profile 2/History'),
  ]

  // Edge
  const edgeProfiles = [
    join(home, 'AppData/Local/Microsoft/Edge/User Data/Default/History'),
  ]

  // Brave
  const braveProfiles = [
    join(home, 'AppData/Local/BraveSoftware/Brave-Browser/User Data/Default/History'),
  ]

  const allProfiles = [...chromeProfiles, ...edgeProfiles, ...braveProfiles]

  for (const historyPath of allProfiles) {
    if (!existsSync(historyPath)) continue

    try {
      // Copy to temp file to avoid SQLite lock conflicts with running browser
      const tmpDir = mkdtempSync(join(tmpdir(), 'ds-figma-'))
      const tmpPath = join(tmpDir, 'History')
      copyFileSync(historyPath, tmpPath)

      const db = new Database(tmpPath, { readonly: true })
      const rows = db.prepare(`
        SELECT url FROM urls
        WHERE (url LIKE '%figma.com/design/%' OR url LIKE '%figma.com/file/%')
        ORDER BY last_visit_time DESC
        LIMIT 100
      `).all() as Array<{ url: string }>

      db.close()
      rmSync(tmpDir, { recursive: true, force: true })

      // Extract unique file keys
      const keyRegex = /figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/
      for (const { url } of rows) {
        const match = url.match(keyRegex)
        if (match && !files.has(match[1])) {
          files.set(match[1], url)
        }
      }
    } catch {
      // Browser locked, permission error, etc — skip silently
    }
  }

  console.log(`[FigmaDiscovery] Found ${files.size} unique Figma files from browser history`)
  return Array.from(files.entries()).map(([key, url]) => ({ key, url }))
}
