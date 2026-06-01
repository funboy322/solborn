/**
 * Prompt builder for the Pro "generate landing page" feature.
 *
 * Produces a single LLM instruction that turns an agent's GeneratedProject
 * (brief + customizable copy) into a strictly-shaped LandingContent JSON.
 * Consumed by /api/landing/generate after the 0.05 SOL mainnet payment
 * has been verified.
 *
 * Tight constraints in the prompt because the renderer expects EXACTLY
 * 4 features / 4 steps / 4 FAQ items — anything else breaks the layout
 * grid. The endpoint also re-validates counts; the prompt's first job is
 * just to give the model unambiguous instructions.
 */

import type { ForgeAgent, GeneratedProject } from '../types'

export function buildLandingPrompt(project: GeneratedProject, agent: ForgeAgent): string {
  const brief = project.brief
  const briefBlock = brief
    ? `Product brief (use this as the source of truth):
- target user: ${brief.targetUser || '(unspecified)'}
- problem: ${brief.problem || '(unspecified)'}
- solution: ${brief.solution || '(unspecified)'}
- mvp: ${brief.mvp || '(unspecified)'}
- solana angle: ${brief.solanaAngle || '(unspecified)'}
- pricing: ${brief.pricing || '(unspecified)'}`
    : 'No structured brief yet — infer from name + tagline + description.'

  const customizedNote =
    project.customFields && project.customFields.length > 0
      ? `The creator has personally edited these fields and they should be reflected verbatim where they fit: ${project.customFields.join(', ')}.`
      : 'The creator has not yet edited any fields — generate fresh marketing copy that matches the brief.'

  return `You are writing a landing page for a Solana product that an AI co-founder ("${agent.name}") helped its human partner build.

Project facts:
- name: ${project.name}
- tagline: ${project.tagline ?? '(none)'}
- description: ${project.description}
- tech stack: ${project.techStack.join(', ')}

${briefBlock}

Agent voice (the AI co-founder's personality bleeds into the copy):
- ${agent.personality || 'pragmatic, builder-tone, no marketing fluff'}

${customizedNote}

Return EXACTLY one JSON object matching this TypeScript type. No markdown, no code fences, no commentary before or after the JSON:

{
  "hero": {
    "headline": "<one short, concrete sentence — what the product does and for whom>",
    "subhead": "<one supporting sentence — why it matters; no buzzwords>",
    "ctaText": "<2-4 words, e.g. 'Get started' or 'Request access'>",
    "ctaHref": "<optional URL; omit if unknown>"
  },
  "features": [
    {"icon": "Sparkles", "title": "<3-5 words>", "body": "<one concrete sentence>"},
    {"icon": "Zap",      "title": "<3-5 words>", "body": "<one concrete sentence>"},
    {"icon": "Shield",   "title": "<3-5 words>", "body": "<one concrete sentence>"},
    {"icon": "Rocket",   "title": "<3-5 words>", "body": "<one concrete sentence>"}
  ],
  "howItWorks": [
    {"stepNumber": 1, "title": "<short verb phrase>", "body": "<one sentence>"},
    {"stepNumber": 2, "title": "<short verb phrase>", "body": "<one sentence>"},
    {"stepNumber": 3, "title": "<short verb phrase>", "body": "<one sentence>"},
    {"stepNumber": 4, "title": "<short verb phrase>", "body": "<one sentence>"}
  ],
  "faq": [
    {"question": "<what real users would ask>", "answer": "<concrete, one-paragraph>"},
    {"question": "<what real users would ask>", "answer": "<concrete, one-paragraph>"},
    {"question": "<what real users would ask>", "answer": "<concrete, one-paragraph>"},
    {"question": "<what real users would ask>", "answer": "<concrete, one-paragraph>"}
  ],
  "cta": {
    "headline": "<short closing call>",
    "subhead": "<optional supporting line, 1 sentence>",
    "buttonText": "<2-4 words>",
    "href": "<optional URL; omit if unknown>"
  }
}

Hard rules:
- EXACTLY 4 features, 4 how-it-works steps, 4 FAQ items. Not 3, not 5.
- All strings are single-line — no \\n inside values, no unescaped quotes.
- No marketing AI-isms: avoid "delve", "leverage", "robust", "comprehensive", "tapestry", "elevate", "unleash", "seamless", "cutting-edge", "harness", "ecosystem" (as metaphor), em-dashes, three-of-a-kind constructions, hollow "real" / "truly" intensifiers.
- Headlines lowercase or sentence case — never Title Case.
- Reference what's concrete in the brief; do not invent features that aren't in scope.
- Icon names must be valid lucide-react PascalCase identifiers (Sparkles, Zap, Shield, Rocket, Code, Compass, Lock, Star, Layers, Wand, Brain). Pick what fits the feature.
- If a field would be empty or generic, omit ctaHref/href entirely (do not include the key).
- Output: JSON only. No prefix text. No code fence. Start with "{" and end with "}".`
}
