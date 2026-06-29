/**
 * Prompt builder for the AI-generated memecoin landing page.
 *
 * Post-pivot (2026-06): SolBorn pivoted from "AI co-founder for Solana
 * startups" to "AI memecoin launchpad on Solana". The landing template
 * now leans on lore, tokenomics, and a how-to-buy walkthrough instead
 * of startup-shape "features / how-it-works".
 *
 * Backward-compat: old projects with ProductBrief still render their
 * legacy features+howItWorks blocks. New generations populate lore +
 * tokenomics + howToBuy. The renderer picks the right blocks at render
 * time based on which fields are present.
 */

import type { ForgeAgent, GeneratedProject } from '../types'

export function buildLandingPrompt(project: GeneratedProject, agent: ForgeAgent): string {
  const memecoin = project.memecoinBrief
  const legacyBrief = project.brief

  const memecoinBlock = memecoin
    ? `Memecoin brief (use this as the source of truth):
- ticker: ${memecoin.ticker || '(unspecified)'}
- contract address: ${memecoin.contractAddress || '(not yet launched)'}
- vibe: ${memecoin.vibe || '(unspecified)'}
- target community: ${memecoin.targetCommunity || '(unspecified)'}
- lore: ${memecoin.lore || '(unspecified)'}
- edge — why this not the next twenty launches today: ${memecoin.edge || '(unspecified)'}
- pump.fun url: ${memecoin.pumpFunUrl || '(not yet)'}`
    : legacyBrief
      ? `Legacy product brief (this project pre-dates the memecoin pivot — translate it into a memecoin frame as best you can):
- target user: ${legacyBrief.targetUser || '(unspecified)'}
- problem: ${legacyBrief.problem || '(unspecified)'}
- solution: ${legacyBrief.solution || '(unspecified)'}
- solana angle: ${legacyBrief.solanaAngle || '(unspecified)'}`
      : 'No brief yet — infer from name + tagline + description.'

  const customizedNote =
    project.customFields && project.customFields.length > 0
      ? `The creator has personally edited these fields and they should be reflected verbatim where they fit: ${project.customFields.join(', ')}.`
      : 'The creator has not yet edited any fields — generate fresh copy that matches the brief.'

  const ticker = memecoin?.ticker?.toUpperCase() ?? project.name.toUpperCase().slice(0, 6)
  const pumpFunUrl =
    memecoin?.pumpFunUrl ||
    (memecoin?.contractAddress
      ? `https://pump.fun/coin/${memecoin.contractAddress}`
      : '')

  return `You are writing a landing page for a Solana memecoin called "${project.name}" (ticker $${ticker}). An AI agent ("${agent.name}") helped its human partner shape the meme through a conversation.

Project facts:
- display name: ${project.name}
- ticker: $${ticker}
- tagline: ${project.tagline ?? '(none)'}
- description: ${project.description}
- tech context: ${project.techStack.join(', ')}

${memecoinBlock}

Agent voice (the agent's personality bleeds into the copy):
- ${agent.personality || 'meme-fluent, vibes-first, with a sharp edge'}

${customizedNote}

Return EXACTLY one JSON object matching this TypeScript type. No markdown, no code fences, no commentary before or after the JSON:

{
  "hero": {
    "headline": "<one short line — ticker + the joke, e.g. '$DOGCEO — the dog is in charge now'>",
    "subhead": "<one supporting sentence — why this exists, who it's for>",
    "ctaText": "<2-4 words, e.g. 'Buy on pump.fun' or 'Join the cult'>",
    "ctaHref": ${pumpFunUrl ? `"${pumpFunUrl}"` : '"<omit if no contract>"'}
  },
  "lore": [
    "<paragraph 1 — origin story / inciting moment>",
    "<paragraph 2 — the world / characters / the joke deepening>",
    "<paragraph 3 — why now / what's next / call to action>"
  ],
  "tokenomics": [
    {"label": "Supply", "value": "<e.g. 1B total>"},
    {"label": "Fair launch", "value": "<e.g. 100% to bonding curve, no pre-mine>"},
    {"label": "Dev allocation", "value": "<e.g. 0% — fair launch>"},
    {"label": "Liquidity", "value": "<e.g. burned at migration / locked / etc.>"}
  ],
  "howToBuy": [
    {"stepNumber": 1, "title": "Get SOL", "body": "<one sentence on getting SOL into wallet>"},
    {"stepNumber": 2, "title": "Open pump.fun", "body": "<one sentence on the link / search>"},
    {"stepNumber": 3, "title": "Swap to $${ticker}", "body": "<one sentence on slippage etc.>"},
    {"stepNumber": 4, "title": "Hold or trade", "body": "<one sentence — the ongoing posture>"}
  ],
  "faq": [
    {"question": "<what real buyers would ask>", "answer": "<one paragraph>"},
    {"question": "<what real buyers would ask>", "answer": "<one paragraph>"},
    {"question": "<what real buyers would ask>", "answer": "<one paragraph>"},
    {"question": "<what real buyers would ask>", "answer": "<one paragraph>"}
  ],
  "cta": {
    "headline": "<short closing call>",
    "subhead": "<optional one-line supporting>",
    "buttonText": "<2-4 words>",
    "href": ${pumpFunUrl ? `"${pumpFunUrl}"` : '"<omit if no contract>"'}
  },
  "riskDisclosure": "Memecoin. Not financial advice. Only trade what you can afford to lose."
}

Hard rules:
- EXACTLY 3 lore paragraphs, 4 tokenomics rows, 4 how-to-buy steps, 4 FAQ items. Not 3, not 5.
- All strings single-line — no \\n inside values, no unescaped quotes.
- No marketing AI-isms: avoid "delve", "leverage", "robust", "comprehensive", "tapestry", "elevate", "unleash", "seamless", "cutting-edge", "harness", "ecosystem" (as metaphor), em-dashes, three-of-a-kind constructions, hollow "real" / "truly" intensifiers.
- Headlines lowercase or sentence case — never Title Case.
- Reference what's concrete in the memecoin brief. Don't invent facts.
- If a field would be empty or generic, omit ctaHref/href entirely (do not include the key).
- riskDisclosure must always be present — protects the platform.
- Output: JSON only. No prefix text. No code fence. Start with "{" and end with "}".`
}
