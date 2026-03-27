import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID
    const appUrl = process.env.VITE_APP_URL || 'http://localhost:3000'

    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured', appUrl })
    }

    const redirectUri = appUrl.trim() + '/api/auth/callback'
    const scope = 'read:user repo'
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
    })
    const url = `https://github.com/login/oauth/authorize?${params.toString()}`

    res.setHeader('Location', url)
    res.status(302).end()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message + '\n' + e.stack : String(e)
    res.status(500).json({ error: msg })
  }
}
