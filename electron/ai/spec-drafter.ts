import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOllama } from 'ollama-ai-provider'
import type { Fragment, AIProviderConfig } from '../../shared/ipc-types'

const SYSTEM_PROMPT = `You are a senior product manager who turns scattered context into clear, build-ready specs.

Rules:
- Output valid GitHub-flavored markdown with these sections, in order:
  # Title, ## Problem, ## Background, ## Goals, ## Non-goals, ## Requirements,
  ## Acceptance criteria, ## Open questions, ## QA notes, ## Decision history.
- Acceptance criteria use Given/When/Then format with [ ] checkboxes.
- Be precise but calm. No fluff. No marketing language.
- Preserve every decision and open question from the source fragments.
- If something is unclear, surface it as an open question instead of inventing it.
- Do not include "Source fragments" — that section is appended automatically.`

export async function draftSpecWithAI(
  fragments: Fragment[],
  config: AIProviderConfig,
  titleOverride?: string,
): Promise<string> {
  if (config.provider === 'none' || fragments.length === 0) {
    throw new Error('AI provider not configured')
  }

  const serialized = fragments
    .map((f) => {
      const lines = [
        `[${f.type.toUpperCase()}] ${f.title}`,
        f.tags.length ? `tags: ${f.tags.join(', ')}` : '',
        f.source ? `source: ${f.source}` : '',
        f.content.trim() ? `\n${f.content.trim()}` : '',
      ].filter(Boolean)
      return lines.join('\n')
    })
    .join('\n\n---\n\n')

  const userPrompt = `Draft a build-ready spec from the following ${fragments.length} fragments.${
    titleOverride ? ` Use this title: "${titleOverride}".` : ''
  }

Fragments:

${serialized}`

  const model = getModel(config)

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    maxTokens: 2500,
  })

  return result.text
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
    return ollama(config.ollamaModel ?? 'llama3.2')
  }

  throw new Error(`Unsupported AI provider: ${config.provider}`)
}
