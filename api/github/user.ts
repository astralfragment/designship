import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getGitHubToken } from '../_lib/token.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getGitHubToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const ghRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!ghRes.ok) {
      return res.status(ghRes.status).json({ error: 'GitHub API error' })
    }

    const user = await ghRes.json()
    res.json({
      login: user.login,
      avatar_url: user.avatar_url,
      name: user.name,
    })
  } catch (err) {
    console.error('User fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}
