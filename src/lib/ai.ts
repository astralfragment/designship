import { createServerFn } from '@tanstack/start-client-core'

// --- Types ---

export type ViewMode = 'builder' | 'stakeholder'

export interface RewriteResult {
  original: string
  rewritten: string
}

export interface ClassifyResult {
  id: string
  category: string
}

export interface WeeklySummary {
  shipped: string[]
  inProgress: string[]
  keyDecisions: string[]
  dateRange: { from: string; to: string }
  generatedAt: string
}

// --- Cache ---

const CACHE_PREFIX = 'ds-ai-cache:'

function simpleHash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}

function cacheKey(text: string): string {
  return `${CACHE_PREFIX}${simpleHash(text.trim())}`
}

function getCached(text: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(cacheKey(text))
}

function setCache(text: string, rewritten: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(cacheKey(text), rewritten)
  } catch {
    clearOldCache()
    try {
      localStorage.setItem(cacheKey(text), rewritten)
    } catch {
      // still full, skip caching
    }
  }
}

function clearOldCache(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_PREFIX)) keys.push(key)
  }
  const toRemove = keys.slice(0, Math.ceil(keys.length / 2))
  for (const key of toRemove) {
    localStorage.removeItem(key)
  }
}

// --- JSON extraction helper ---

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (ch === '{') depth++
      else if (ch === '}') depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

// --- Shared Claude API helper (server-only) ---

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Set it in your environment variables.',
    )
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`Claude API error: ${res.status}`, body)
    throw new Error('Failed to process AI request. Please try again.')
  }

  const json = (await res.json()) as {
    content: Array<{ type: string; text: string }>
  }

  return json.content.find((c) => c.type === 'text')?.text ?? ''
}

// --- Server function ---

const rewriteOnServer = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => {
    if (!d || typeof d !== 'object') throw new Error('Invalid input: expected { texts: string[] }')
    const obj = d as Record<string, unknown>
    if (!Array.isArray(obj.texts) || !obj.texts.every((t: unknown) => typeof t === 'string')) {
      throw new Error('Invalid input: expected { texts: string[] }')
    }
    if (obj.texts.length > 100) throw new Error('Too many items: maximum 100 texts per request')
    for (const t of obj.texts as string[]) {
      if (t.length > 5000) throw new Error('Text too long: maximum 5000 characters per item')
    }
    return obj as { texts: string[] }
  })
  .handler(async ({ data }): Promise<string[]> => {
    const { texts } = data

    if (texts.length === 0) return []

    const numbered = texts
      .map((t: string, i: number) => `[${i + 1}] ${t}`)
      .join('\n\n')

    const responseText = await callClaude(
      `You are a technical writer for a software team. Rewrite the following technical PR descriptions and commit messages into plain English that a non-technical stakeholder can understand.

Rules:
- Keep each rewrite concise (1-2 sentences max)
- Focus on WHAT changed and WHY it matters, not HOW
- No technical jargon (no "refactor", "endpoint", "API", "merge", "branch", etc.)
- Use active voice
- If the original is empty or unclear, write "Minor update"
- Return ONLY the numbered rewrites in the same [N] format, nothing else

${numbered}`,
      2048,
    )

    // Parse numbered responses: [1] text, [2] text, etc.
    const parsed: string[] = []
    const lines = responseText.split('\n')
    let current = ''
    let currentIdx = -1

    for (const line of lines) {
      const match = line.match(/^\[(\d+)\]\s*(.*)/)
      if (match) {
        if (currentIdx >= 0) {
          parsed[currentIdx] = current.trim()
        }
        currentIdx = parseInt(match[1]!, 10) - 1
        current = match[2] ?? ''
      } else if (currentIdx >= 0) {
        current += ' ' + line
      }
    }
    if (currentIdx >= 0) {
      parsed[currentIdx] = current.trim()
    }

    // Fill any gaps
    return texts.map((_: string, i: number) => parsed[i] || 'Minor update')
  })

// --- Classify server function ---

const classifyOnServer = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => {
    if (!d || typeof d !== 'object') throw new Error('Invalid input: expected { entries: Array<{ id, title, description }> }')
    const obj = d as Record<string, unknown>
    if (!Array.isArray(obj.entries)) {
      throw new Error('Invalid input: expected { entries: Array<{ id, title, description }> }')
    }
    if (obj.entries.length > 100) throw new Error('Too many items: maximum 100 entries per request')
    for (const entry of obj.entries) {
      if (!entry || typeof entry !== 'object') throw new Error('Invalid entry: expected { id, title, description }')
      const e = entry as Record<string, unknown>
      if (typeof e.id !== 'string' || typeof e.title !== 'string') {
        throw new Error('Invalid entry: id and title must be strings')
      }
      if (e.description !== null && typeof e.description !== 'string') {
        throw new Error('Invalid entry: description must be string or null')
      }
    }
    return obj as { entries: Array<{ id: string; title: string; description: string | null }> }
  })
  .handler(async ({ data }): Promise<ClassifyResult[]> => {
    const { entries } = data

    if (entries.length === 0) return []

    const numbered = entries
      .map((e, i) => `[${i + 1}] ${e.title}${e.description ? ` — ${e.description.slice(0, 200)}` : ''}`)
      .join('\n')

    const responseText = await callClaude(
      `Classify these development activities into feature areas. Use short, human-friendly category names (2-3 words max) like "User Authentication", "UI Updates", "Performance", "Bug Fixes", "Data Pipeline", "Documentation", etc.

Rules:
- Group similar items under the same category name
- Use consistent naming (don't use "Auth" for one and "Authentication" for another)
- Return ONLY numbered lines in format: [N] Category Name
- Keep category names non-technical and stakeholder-friendly

${numbered}`,
      1024,
    )

    const results: ClassifyResult[] = []
    for (const line of responseText.split('\n')) {
      const match = line.match(/^\[(\d+)\]\s*(.+)/)
      if (match) {
        const idx = parseInt(match[1]!, 10) - 1
        const entry = entries[idx]
        if (entry) {
          results.push({ id: entry.id, category: match[2]!.trim() })
        }
      }
    }

    // Fill any gaps with "Other Updates"
    for (const entry of entries) {
      if (!results.find((r) => r.id === entry.id)) {
        results.push({ id: entry.id, category: 'Other Updates' })
      }
    }

    return results
  })

// --- Weekly summary server function ---

const generateSummaryOnServer = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => {
    if (!d || typeof d !== 'object') throw new Error('Invalid input: expected { entries: Array<{ title, description, date }> }')
    const obj = d as Record<string, unknown>
    if (!Array.isArray(obj.entries)) {
      throw new Error('Invalid input: expected { entries: Array<{ title, description, date }> }')
    }
    if (obj.entries.length > 200) throw new Error('Too many items: maximum 200 entries per request')
    for (const entry of obj.entries) {
      if (!entry || typeof entry !== 'object') throw new Error('Invalid entry: expected { title, description, date }')
      const e = entry as Record<string, unknown>
      if (typeof e.title !== 'string' || typeof e.date !== 'string') {
        throw new Error('Invalid entry: title and date must be strings')
      }
      if (e.description !== null && typeof e.description !== 'string') {
        throw new Error('Invalid entry: description must be string or null')
      }
    }
    return obj as { entries: Array<{ title: string; description: string | null; date: string }> }
  })
  .handler(async ({ data }): Promise<{ shipped: string[]; inProgress: string[]; keyDecisions: string[] }> => {
    const { entries } = data

    if (entries.length === 0) {
      return { shipped: ['No activity this week'], inProgress: [], keyDecisions: [] }
    }

    const formatted = entries
      .map(
        (e, i) =>
          `[${i + 1}] ${e.title} (${e.date})${e.description ? `\n    ${e.description.slice(0, 300)}` : ''}`,
      )
      .join('\n')

    const responseText = await callClaude(
      `You are a technical writer generating a weekly team update. Given these merged pull requests from the past week, create a structured summary.

Rules:
- Write in plain English that non-technical stakeholders can understand
- No technical jargon (no "refactor", "endpoint", "API", "merge", "branch", etc.)
- Use active voice, concise bullet points (1 sentence each)
- Group related items together
- If something looks like a bug fix, mention it in "What shipped"
- Return ONLY valid JSON with this exact structure:
{"shipped": ["item 1", "item 2"], "inProgress": ["item 1"], "keyDecisions": ["item 1"]}
- "shipped" = completed features, fixes, improvements
- "inProgress" = items that appear partial or ongoing based on PR titles
- "keyDecisions" = architectural or design choices visible in the PRs
- Each array should have 2-6 items. Combine related items.
- If no items fit a category, use an empty array

Activity from this week:
${formatted}`,
      1024,
    )

    // Extract JSON from response using brace-balancing (handles nested braces in string values)
    const jsonStr = extractJsonObject(responseText)
    if (!jsonStr) {
      return { shipped: ['Weekly summary generated but could not be parsed'], inProgress: [], keyDecisions: [] }
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      return { shipped: ['Weekly summary generated but could not be parsed'], inProgress: [], keyDecisions: [] }
    }

    const toStringArray = (val: unknown): string[] => {
      if (!Array.isArray(val)) return []
      return val.filter((item): item is string => typeof item === 'string')
    }

    return {
      shipped: toStringArray(parsed.shipped),
      inProgress: toStringArray(parsed.inProgress),
      keyDecisions: toStringArray(parsed.keyDecisions),
    }
  })

// --- Public API ---

export async function classifyByFeature(
  entries: Array<{ id: string; title: string; description: string | null }>,
): Promise<Record<string, string>> {
  if (entries.length === 0) return {}

  const results = await classifyOnServer({ data: { entries } })
  const map: Record<string, string> = {}
  for (const r of results) {
    map[r.id] = r.category
  }
  return map
}

export async function batchRewriteForHumans(
  texts: string[],
): Promise<RewriteResult[]> {
  if (texts.length === 0) return []

  const results: RewriteResult[] = texts.map((t) => ({
    original: t,
    rewritten: '',
  }))

  const uncachedIndices: number[] = []
  const uncachedTexts: string[] = []

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i]!
    if (!text || text.trim().length === 0) {
      results[i]!.rewritten = 'Minor update'
      continue
    }
    const cached = getCached(text)
    if (cached) {
      results[i]!.rewritten = cached
    } else {
      uncachedIndices.push(i)
      uncachedTexts.push(text)
    }
  }

  if (uncachedTexts.length === 0) return results

  const BATCH_SIZE = 10
  for (let start = 0; start < uncachedTexts.length; start += BATCH_SIZE) {
    const chunk = uncachedTexts.slice(start, start + BATCH_SIZE)
    const chunkIndices = uncachedIndices.slice(start, start + BATCH_SIZE)

    const rewritten = await rewriteOnServer({ data: { texts: chunk } })

    for (let j = 0; j < chunkIndices.length; j++) {
      const idx = chunkIndices[j]!
      const text = chunk[j]!
      const result = rewritten[j] || 'Minor update'
      results[idx]!.rewritten = result
      setCache(text, result)
    }
  }

  return results
}

export async function generateWeeklySummary(
  entries: Array<{ title: string; description: string | null; date: string }>,
  dateRange: { from: string; to: string },
): Promise<WeeklySummary> {
  const result = await generateSummaryOnServer({ data: { entries } })

  return {
    ...result,
    dateRange,
    generatedAt: new Date().toISOString(),
  }
}
