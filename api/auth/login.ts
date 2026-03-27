import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID
    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured' })
    }
    const redirectUri = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/auth/callback`
    const scope = 'read:user repo'
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`
    res.redirect(302, url)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message + '\n' + e.stack : String(e)
    res.status(500).json({ error: msg })
  }
}
