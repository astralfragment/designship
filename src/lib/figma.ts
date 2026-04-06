import { createServerFn } from '@tanstack/start-client-core'
import { FIGMA_TOKEN_KEY } from './auth'
import { supabase } from './supabase'

const FIGMA_API = 'https://api.figma.com/v1'

function getToken(): string | null {
  return typeof window !== 'undefined'
    ? localStorage.getItem(FIGMA_TOKEN_KEY)
    : null
}

export function setFigmaToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FIGMA_TOKEN_KEY, token)
  }
}

export function clearFigmaToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(FIGMA_TOKEN_KEY)
  }
}

export function hasFigmaToken(): boolean {
  return !!getToken()
}

// --- Error classes ---

class FigmaAuthError extends Error {
  constructor() {
    super('Figma authentication failed. Please reconnect your Figma account.')
    this.name = 'FigmaAuthError'
  }
}

class FigmaRateLimitError extends Error {
  constructor() {
    super('Figma API rate limit exceeded. Please try again in a moment.')
    this.name = 'FigmaRateLimitError'
  }
}

// --- Typed fetch wrapper ---

interface FigmaRequestOptions {
  token?: string | null
}

async function figmaFetch<T>(
  path: string,
  options: FigmaRequestOptions = {},
): Promise<T> {
  const token = options.token ?? getToken()
  if (!token) throw new FigmaAuthError()

  const res = await fetch(`${FIGMA_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 401 || res.status === 403) {
    throw new FigmaAuthError()
  }

  if (res.status === 429) {
    throw new FigmaRateLimitError()
  }

  if (!res.ok) {
    throw new Error(`Figma API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

// --- Types ---

export interface FigmaFile {
  key: string
  name: string
  thumbnail_url: string
  last_modified: string
}

export interface FigmaImage {
  url: string
  nodeId: string
}

interface FigmaImagesResponse {
  images: Record<string, string | null>
}

// --- API Functions ---

const FIGMA_KEY_PATTERN = /^[a-zA-Z0-9]+$/

export async function fetchFileScreenshot(
  fileKey: string,
  nodeId: string,
  token?: string | null,
): Promise<string | null> {
  if (!FIGMA_KEY_PATTERN.test(fileKey)) {
    throw new Error('Invalid Figma file key')
  }
  const encodedNodeId = encodeURIComponent(nodeId)
  const response = await figmaFetch<FigmaImagesResponse>(
    `/images/${fileKey}?ids=${encodedNodeId}&format=png&scale=2`,
    { token },
  )
  return response.images[nodeId] ?? null
}

// --- OAuth flow ---

export function getFigmaOAuthUrl(): string {
  const clientId = import.meta.env.VITE_FIGMA_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_FIGMA_CLIENT_ID is not configured')
  }

  const redirectUri = `${window.location.origin}/auth/figma-callback`
  const state = crypto.randomUUID()

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('ds-figma-oauth-state', state)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'files:read',
    state,
    response_type: 'code',
  })

  return `https://www.figma.com/oauth?${params.toString()}`
}

export function validateOAuthState(state: string): boolean {
  if (typeof window === 'undefined') return false
  const stored = sessionStorage.getItem('ds-figma-oauth-state')
  if (stored === state) {
    sessionStorage.removeItem('ds-figma-oauth-state')
    return true
  }
  return false
}

// Server function for token exchange (client_secret stays server-side)
export const exchangeFigmaCode = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => {
    if (!d || typeof d !== 'object') throw new Error('Invalid input')
    const obj = d as Record<string, unknown>
    if (typeof obj.accessToken !== 'string' || obj.accessToken.length === 0) {
      throw new Error('Unauthorized: accessToken is required')
    }
    if (typeof obj.code !== 'string' || obj.code.length === 0 || obj.code.length > 512) {
      throw new Error('Invalid authorization code')
    }
    return { code: obj.code, accessToken: obj.accessToken }
  })
  .handler(async ({ data }): Promise<{ access_token: string }> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.accessToken)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }
    const clientId = process.env.FIGMA_CLIENT_ID
    const clientSecret = process.env.FIGMA_CLIENT_SECRET
    const siteUrl =
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    if (!clientId || !clientSecret) {
      throw new Error(
        'Figma OAuth credentials not configured. Set FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET.',
      )
    }

    // Construct redirect URI server-side to prevent OAuth redirect manipulation
    const redirectUri = `${siteUrl}/auth/figma-callback`

    const res = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: data.code,
        grant_type: 'authorization_code',
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`Figma token exchange failed: ${res.status}`, body)
      throw new Error('Figma token exchange failed. Please try again.')
    }

    const json = (await res.json()) as { access_token: string }
    return { access_token: json.access_token }
  })

// --- Figma link parsing ---

const FIGMA_URL_PATTERN =
  'https:\\/\\/(?:www\\.)?figma\\.com\\/(?:design|file)\\/([a-zA-Z0-9]+)(?:\\/[^?]*)?(?:\\?.*node-id=([^&]+))?'

export interface FigmaLink {
  fileKey: string
  nodeId: string | null
  url: string
}

export function extractFigmaLinks(text: string): FigmaLink[] {
  const links: FigmaLink[] = []
  let match: RegExpExecArray | null

  const regex = new RegExp(FIGMA_URL_PATTERN, 'g')
  while ((match = regex.exec(text)) !== null) {
    const nodeId = match[2] ? decodeURIComponent(match[2]).replace(/-/g, ':') : null
    links.push({
      fileKey: match[1]!,
      nodeId,
      url: match[0],
    })
  }

  return links
}

export { FigmaAuthError, FigmaRateLimitError }
