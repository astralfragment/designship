import { createServerFn } from '@tanstack/start-client-core'

const FIGMA_API = 'https://api.figma.com/v1'
const FIGMA_TOKEN_KEY = 'ds-figma-token'

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

export interface FigmaFileDetail {
  name: string
  lastModified: string
  thumbnailUrl: string
  version: string
}

export interface FigmaImage {
  url: string
  nodeId: string
}

interface FigmaFilesResponse {
  files: Array<{
    key: string
    name: string
    thumbnail_url: string
    last_modified: string
  }>
}

interface FigmaImagesResponse {
  images: Record<string, string | null>
}

interface FigmaFileResponse {
  name: string
  lastModified: string
  thumbnailUrl: string
  version: string
}

// --- API Functions ---

export async function fetchRecentFiles(
  token?: string | null,
): Promise<FigmaFile[]> {
  const response = await figmaFetch<FigmaFilesResponse>('/me/files', {
    token,
  })
  return response.files.map((f) => ({
    key: f.key,
    name: f.name,
    thumbnail_url: f.thumbnail_url,
    last_modified: f.last_modified,
  }))
}

export async function fetchFileScreenshot(
  fileKey: string,
  nodeId: string,
  token?: string | null,
): Promise<string | null> {
  const encodedNodeId = encodeURIComponent(nodeId)
  const response = await figmaFetch<FigmaImagesResponse>(
    `/images/${fileKey}?ids=${encodedNodeId}&format=png&scale=2`,
    { token },
  )
  return response.images[nodeId] ?? null
}

export async function fetchFileInfo(
  fileKey: string,
  token?: string | null,
): Promise<FigmaFileDetail> {
  const response = await figmaFetch<FigmaFileResponse>(
    `/files/${fileKey}?depth=1`,
    { token },
  )
  return {
    name: response.name,
    lastModified: response.lastModified,
    thumbnailUrl: response.thumbnailUrl,
    version: response.version,
  }
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
  sessionStorage.removeItem('ds-figma-oauth-state')
  return stored === state
}

// Server function for token exchange (client_secret stays server-side)
export const exchangeFigmaCode = createServerFn({ method: 'POST' })
  .inputValidator((d: { code: string; redirectUri: string }) => d)
  .handler(async ({ data }): Promise<{ access_token: string }> => {
    const clientId = process.env.FIGMA_CLIENT_ID
    const clientSecret = process.env.FIGMA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error(
        'Figma OAuth credentials not configured. Set FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET.',
      )
    }

    const { code, redirectUri } = data as { code: string; redirectUri: string }

    const res = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Figma token exchange failed: ${res.status} ${body}`)
    }

    const json = (await res.json()) as { access_token: string }
    return { access_token: json.access_token }
  })

// --- Figma link parsing ---

const FIGMA_URL_REGEX =
  /https:\/\/(?:www\.)?figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)(?:\/[^?]*)?(?:\?.*node-id=([^&]+))?/g

export interface FigmaLink {
  fileKey: string
  nodeId: string | null
  url: string
}

export function extractFigmaLinks(text: string): FigmaLink[] {
  const links: FigmaLink[] = []
  let match: RegExpExecArray | null

  const regex = new RegExp(FIGMA_URL_REGEX)
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
