import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOllama } from 'ollama-ai-provider'
import type { DSEvent, SummaryType, AIProviderConfig } from '../../shared/ipc-types'

const SYSTEM_PROMPT = `You are a technical product communicator. You translate design and development activity into clear stakeholder updates.

Rules:
- Never use commit hashes, branch names, or Figma node IDs in the output
- Use plain English: "The login screen was redesigned" not "Updated Frame 47:281"
- Group related changes into features, not individual commits
- Lead with what shipped, then what's in progress
- Be concise — stakeholders skim, they don't read novels
- Include mentions of design screenshots where available`

const TYPE_INSTRUCTIONS: Record<SummaryType, string> = {
  weekly: 'Generate a weekly digest summarizing all design and development activity. Group by feature area. Highlight cross-references between design and code changes.',
  changelog: 'Generate a changelog suitable for release notes. Group by feature, list what changed in plain English. Mention design changes alongside code changes.',
  standup: 'Generate a standup update. Format as "Yesterday:" (what was done) and "In Progress:" (open items based on recent branch activity).',
  adhoc: 'Generate a concise summary of the provided activity.',
}

export async function generateAISummary(
  events: DSEvent[],
  type: SummaryType,
  config: AIProviderConfig,
): Promise<{ content: string; model: string }> {
  if (config.provider === 'none' || events.length === 0) {
    return { content: '_No AI provider configured or no events._', model: 'none' }
  }

  // Serialize events into a compact format for the prompt
  const serialized = events.map((e) => {
    const meta = e.metadata as Record<string, unknown> | null
    return [
      `[${e.source.toUpperCase()}] ${e.timestamp.slice(0, 16)}`,
      `  ${e.title}`,
      e.actor ? `  by: ${e.actor}` : '',
      meta?.figmaFileName ? `  file: ${meta.figmaFileName}` : '',
      meta?.repoName ? `  repo: ${meta.repoName}` : '',
      meta?.figmaLinks ? `  → links to Figma` : '',
    ].filter(Boolean).join('\n')
  }).join('\n\n')

  const userPrompt = `${TYPE_INSTRUCTIONS[type]}

Activity log (${events.length} events):

${serialized}`

  const model = getModel(config)

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    maxTokens: 2000,
  })

  const modelName = config.provider === 'claude'
    ? 'claude-sonnet-4-20250514'
    : config.ollamaModel ?? 'ollama'

  return { content: result.text, model: modelName }
}

function getModel(config: AIProviderConfig) {
  if (config.provider === 'claude' && config.apiKey) {
    const anthropic = createAnthropic({ apiKey: config.apiKey })
    return anthropic('claude-sonnet-4-20250514')
  }

  if (config.provider === 'ollama') {
    const ollama = createOllama({
      baseURL: config.ollamaBaseUrl ?? 'http://localhost:11434/api',
    })
    return ollama(config.ollamaModel ?? 'qwen2.5-coder:14b')
  }

  throw new Error(`Unsupported AI provider: ${config.provider}`)
}
