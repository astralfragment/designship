import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getGitHubToken } from '../_lib/token.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getGitHubToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  // This endpoint is available for future AI-enhanced summaries
  // The current implementation generates summaries client-side deterministically
  res.json({ message: 'Summary generation is handled client-side' })
}
