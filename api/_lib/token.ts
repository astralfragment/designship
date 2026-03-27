import crypto from 'crypto'
import type { VercelRequest } from '@vercel/node'

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name) cookies[name] = rest.join('=')
  })
  return cookies
}

function decrypt(encrypted: string, secret: string): string {
  const [ivHex, encryptedData] = encrypted.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const key = crypto.scryptSync(secret, 'salt', 32)
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export function getGitHubToken(req: VercelRequest): string | null {
  const sessionSecret = process.env.SESSION_SECRET
  if (!sessionSecret) return null

  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)
  const encryptedToken = cookies['gh_token']
  if (!encryptedToken) return null

  try {
    return decrypt(encryptedToken, sessionSecret)
  } catch {
    return null
  }
}
