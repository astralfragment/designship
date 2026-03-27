import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getGitHubToken } from '../_lib/token.js'

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name) cookies[name] = rest.join('=')
  })
  return cookies
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code parameter' })
  }

  const clientId = process.env.FIGMA_CLIENT_ID
  const clientSecret = process.env.FIGMA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Missing Figma environment variables' })
  }

  // Verify state
  const cookieHeader = req.headers.cookie || ''
  const cookies = parseCookies(cookieHeader)
  if (!state || state !== cookies['figma_oauth_state']) {
    return res.status(400).json({ error: 'Invalid OAuth state' })
  }

  // Need GitHub token to identify the user
  const ghToken = getGitHubToken(req)
  if (!ghToken) {
    return res.status(401).json({ error: 'Not authenticated with GitHub' })
  }

  try {
    const baseUrl = process.env.VERCEL_URL
      ? 'https://' + process.env.VERCEL_URL
      : 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/auth/figma-callback`

    // Exchange code for token
    const tokenRes = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Failed to get Figma token' })
    }

    // Look up user by GitHub token and store Figma tokens
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get GitHub user to find our user record
    const ghUserRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${ghToken}` },
    })
    const ghUser = await ghUserRes.json()

    await supabase
      .from('users')
      .update({
        figma_token: tokenData.access_token,
        figma_refresh_token: tokenData.refresh_token || null,
        updated_at: new Date().toISOString(),
      })
      .eq('github_id', String(ghUser.id))

    // Clear state cookie
    res.setHeader(
      'Set-Cookie',
      `figma_oauth_state=; Path=/; HttpOnly; Max-Age=0`
    )

    res.redirect(302, `${baseUrl}/dashboard`)
  } catch (err) {
    console.error('Figma OAuth callback error:', err)
    res.status(500).json({ error: 'Failed to exchange code for Figma token' })
  }
}
