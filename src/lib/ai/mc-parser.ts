/**
 * Streaming-safe parser for inline `<mc_question>...</mc_question>` blocks
 * that the agent may emit instead of a text-only reply.
 *
 * The block format (single JSON object inside the tag):
 *   <mc_question id="frustration_q1">
 *   {
 *     "text": "what frustrates you most in your day-to-day?",
 *     "options": [
 *       {"id":"slow",  "label":"slow shipping cycles",  "trait":"codingSkill",    "delta":3},
 *       {"id":"vague", "label":"vague product specs",   "trait":"creativity",     "delta":3},
 *       {"id":"lonely","label":"no one to argue with",  "trait":"founderMindset", "delta":5},
 *       {"id":"dark",  "label":"working in the dark"}
 *     ],
 *     "save_as": "frustration"
 *   }
 *   </mc_question>
 *
 * Options without `trait`+`delta` only save as preference text, no bar bump.
 *
 * Parser contract:
 *   - During streaming, half-emitted blocks render as a "thinking" placeholder
 *     so the user doesn't see raw JSON.
 *   - When `</mc_question>` closes and JSON parses cleanly → render as MC card.
 *   - When close arrives but JSON is broken → fall back to plain text bubble
 *     (so a bad LLM emission never blocks the conversation).
 */

import type { AgentSkills } from '../types'

export interface McOption {
  id: string
  label: string
  /** If present, tapping this option bumps the matching skill by `delta`. */
  trait?: keyof AgentSkills
  /** Default 1 if `trait` is set but `delta` is omitted. */
  delta?: number
}

export interface McQuestion {
  /** Stable id from the LLM, used as React key + analytics. */
  id: string
  text: string
  options: McOption[]
  /** Optional preference key — if set, the chosen label is saved on the agent. */
  saveAs?: string
}

export type ParsedAgentMessage =
  | { kind: 'text'; text: string }
  | { kind: 'mc_question'; preText: string; question: McQuestion; postText: string; raw: string }
  | { kind: 'streaming_mc'; preText: string }

const OPEN_TAG = /<mc_question(?:\s+id="([^"]*)")?\s*>/i
const CLOSE_TAG = /<\/mc_question>/i

const VALID_TRAITS: ReadonlySet<keyof AgentSkills> = new Set<keyof AgentSkills>([
  'curiosity',
  'solanaKnowledge',
  'codingSkill',
  'creativity',
  'founderMindset',
])

function safeParseQuestion(jsonText: string, tagId: string | null): McQuestion | null {
  let raw: unknown
  try {
    raw = JSON.parse(jsonText.trim())
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const text = typeof obj.text === 'string' ? obj.text.trim() : ''
  if (!text) return null

  const rawOptions = Array.isArray(obj.options) ? obj.options : []
  const options: McOption[] = []
  for (const o of rawOptions) {
    if (!o || typeof o !== 'object') continue
    const opt = o as Record<string, unknown>
    const label = typeof opt.label === 'string' ? opt.label.trim() : ''
    if (!label) continue
    const id =
      typeof opt.id === 'string' && opt.id.trim()
        ? opt.id.trim()
        : `opt-${options.length}`
    const traitRaw = typeof opt.trait === 'string' ? (opt.trait as keyof AgentSkills) : undefined
    const trait = traitRaw && VALID_TRAITS.has(traitRaw) ? traitRaw : undefined
    const deltaRaw = typeof opt.delta === 'number' ? opt.delta : undefined
    const delta = trait ? Math.max(1, Math.min(10, deltaRaw ?? 1)) : undefined
    options.push({ id, label, trait, delta })
    if (options.length >= 4) break // hard cap per design
  }
  if (options.length === 0) return null

  const saveAs =
    typeof obj.save_as === 'string' && obj.save_as.trim()
      ? obj.save_as.trim()
      : undefined

  const id =
    tagId && tagId.trim()
      ? tagId.trim()
      : `mc-${Math.random().toString(36).slice(2, 8)}`

  return { id, text, options, saveAs }
}

/**
 * Parse an in-flight or complete agent message.
 * Returns one of three discriminated variants — caller renders accordingly.
 */
export function parseAgentMessage(content: string): ParsedAgentMessage {
  if (!content) return { kind: 'text', text: '' }

  const openMatch = content.match(OPEN_TAG)
  if (!openMatch || openMatch.index === undefined) {
    return { kind: 'text', text: content }
  }

  const openStart = openMatch.index
  const openEnd = openStart + openMatch[0].length
  const preText = content.slice(0, openStart).trimEnd()

  const remainder = content.slice(openEnd)
  const closeMatch = remainder.match(CLOSE_TAG)
  if (!closeMatch || closeMatch.index === undefined) {
    // Tag opened but not closed yet — still streaming.
    return { kind: 'streaming_mc', preText }
  }

  const innerJson = remainder.slice(0, closeMatch.index)
  const postText = remainder.slice(closeMatch.index + closeMatch[0].length).trimStart()
  const tagId = openMatch[1] ?? null

  const question = safeParseQuestion(innerJson, tagId)
  if (!question) {
    // Bad JSON — degrade to plain text so the user still sees something coherent.
    const fallback = (preText + '\n\n' + innerJson + '\n\n' + postText).trim()
    return { kind: 'text', text: fallback }
  }

  return {
    kind: 'mc_question',
    preText,
    question,
    postText,
    raw: content.slice(openStart, openEnd + closeMatch.index + closeMatch[0].length),
  }
}
