import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getGitHubToken } from './_lib/token.js'
import { supabase } from './_supabase.js'

interface GitHubPRData {
  id: number
  number: number
  title: string
  body: string | null
  merged_at: string | null
  html_url: string
  head: { ref: string }
  user: { login: string; avatar_url: string }
  commits: number
  additions: number
  deletions: number
  base: { repo: { full_name: string } }
}

async function syncGitHubPRs(ghToken: string, userId: string) {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().split('T')[0]

  // Get GitHub username
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3+json' },
  })
  const user = await userRes.json()
  const username = user.login

  // Search merged PRs from last 30 days
  const searchQuery = `type:pr+author:${username}+is:merged+merged:>=${sinceStr}`
  const searchRes = await fetch(
    `https://api.github.com/search/issues?q=${searchQuery}&sort=updated&order=desc&per_page=100`,
    {
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3+json' },
    }
  )

  if (!searchRes.ok) return 0

  const searchData = await searchRes.json()
  let synced = 0

  for (const item of searchData.items.slice(0, 50)) {
    if (!item.pull_request?.url) continue

    try {
      const prRes = await fetch(item.pull_request.url, {
        headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3+json' },
      })
      const pr: GitHubPRData = await prRes.json()

      await supabase.from('github_prs').upsert(
        {
          user_id: userId,
          pr_number: pr.number,
          repo: pr.base.repo.full_name,
          title: pr.title,
          description: pr.body,
          branch: pr.head.ref,
          merged_at: pr.merged_at,
          commit_count: pr.commits,
          additions: pr.additions,
          deletions: pr.deletions,
          raw_data: pr,
        },
        { onConflict: 'user_id,repo,pr_number' }
      )
      synced++
    } catch {
      // Skip individual PR failures
    }
  }

  return synced
}

async function syncFigmaFrames(figmaToken: string, userId: string) {
  let synced = 0

  // Get user's teams and files
  const meRes = await fetch('https://api.figma.com/v1/me', {
    headers: { Authorization: `Bearer ${figmaToken}` },
  })
  if (!meRes.ok) return 0
  const me = await meRes.json()

  const fileKeys: Array<{ key: string; name: string }> = []

  // Collect files from teams
  if (me.teams && Array.isArray(me.teams)) {
    for (const team of me.teams.slice(0, 5)) {
      try {
        const projRes = await fetch(`https://api.figma.com/v1/teams/${team.id}/projects`, {
          headers: { Authorization: `Bearer ${figmaToken}` },
        })
        if (!projRes.ok) continue
        const projData = await projRes.json()

        for (const project of (projData.projects || []).slice(0, 10)) {
          const filesRes = await fetch(`https://api.figma.com/v1/projects/${project.id}/files`, {
            headers: { Authorization: `Bearer ${figmaToken}` },
          })
          if (!filesRes.ok) continue
          const filesData = await filesRes.json()
          for (const file of (filesData.files || []).slice(0, 20)) {
            fileKeys.push({ key: file.key, name: file.name })
          }
        }
      } catch {
        // Skip inaccessible teams
      }
    }
  }

  // For each file, extract frames
  for (const file of fileKeys.slice(0, 20)) {
    try {
      const fileRes = await fetch(
        `https://api.figma.com/v1/files/${file.key}?depth=3`,
        { headers: { Authorization: `Bearer ${figmaToken}` } }
      )
      if (!fileRes.ok) continue
      const fileData = await fileRes.json()

      const frames: Array<{ id: string; name: string }> = []
      function extractFrames(node: { id: string; name: string; type: string; children?: Array<{ id: string; name: string; type: string; children?: unknown[] }> }) {
        if (node.type === 'FRAME') {
          frames.push({ id: node.id, name: node.name })
        }
        if (node.children) {
          for (const child of node.children) {
            extractFrames(child as typeof node)
          }
        }
      }
      if (fileData.document?.children) {
        for (const page of fileData.document.children) {
          extractFrames(page)
        }
      }

      // Get thumbnails for frames
      let thumbnails: Record<string, string | null> = {}
      if (frames.length > 0) {
        const ids = frames.map((f) => f.id).join(',')
        try {
          const thumbRes = await fetch(
            `https://api.figma.com/v1/images/${file.key}?ids=${encodeURIComponent(ids)}&format=png&scale=1`,
            { headers: { Authorization: `Bearer ${figmaToken}` } }
          )
          if (thumbRes.ok) {
            const thumbData = await thumbRes.json()
            thumbnails = thumbData.images || {}
          }
        } catch {
          // Continue without thumbnails
        }
      }

      // Upsert frames
      for (const frame of frames) {
        await supabase.from('figma_frames').upsert(
          {
            user_id: userId,
            file_key: file.key,
            file_name: file.name,
            frame_id: frame.id,
            frame_name: frame.name,
            thumbnail_url: thumbnails[frame.id] || null,
            last_modified: fileData.lastModified || null,
            raw_data: { file_key: file.key, frame },
          },
          { onConflict: 'user_id,file_key,frame_id' }
        )
        synced++
      }
    } catch {
      // Skip file failures
    }
  }

  return synced
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ghToken = getGitHubToken(req)
  if (!ghToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    // Get GitHub user to find our DB user
    const ghUserRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3+json' },
    })
    const ghUser = await ghUserRes.json()

    // Upsert user record
    const { data: userData } = await supabase
      .from('users')
      .upsert(
        {
          github_id: String(ghUser.id),
          github_login: ghUser.login,
          github_avatar: ghUser.avatar_url,
          github_token: ghToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'github_id' }
      )
      .select('id, figma_token')
      .single()

    if (!userData) {
      return res.status(500).json({ error: 'Failed to upsert user' })
    }

    const userId = userData.id

    // Sync GitHub PRs
    const prCount = await syncGitHubPRs(ghToken, userId)

    // Sync Figma frames (if connected)
    let frameCount = 0
    if (userData.figma_token) {
      frameCount = await syncFigmaFrames(userData.figma_token, userId)
    }

    // Artifact pairing is handled in PRD 03
    const artifactCount = 0

    res.json({
      synced: {
        prs: prCount,
        frames: frameCount,
        artifacts: artifactCount,
      },
    })
  } catch (err) {
    console.error('Sync error:', err)
    res.status(500).json({ error: 'Sync failed' })
  }
}
