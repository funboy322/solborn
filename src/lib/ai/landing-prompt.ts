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

Voice reference: memecoin Twitter (crypto CT), not startup landing pages. Lowercase, terse, self-aware, jokes not roadmaps. Think shitpost with structure, not press release with jokes.

Good hero examples to imitate the register (not the specific content):
  "$NGMI. the coin for people who know they aren't gonna make it."
  "wojak was right. buy $COPE."
  "the cat is CEO now. deal with it. $GIGACAT."

Bad hero examples to avoid:
  "Introducing $DOGE, a revolutionary meme coin that empowers..."
  "The FUTURE of finance. Buy now!"

Good lore paragraph example (this is 68 words, target for each of the 3 paragraphs):
  "the goblins came out of the tree line in the summer of 2024. nobody knows where they slept the night before. some say the abandoned wework in soho. some say the discord servers of dead nft projects. the goblins don't care. they showed up with terminal windows open, five monitors each, and a look in their eyes that said the party is happening whether you show up or not."

If your paragraph is 20 words, you did not follow this. Go back and write more.

Return EXACTLY one JSON object matching this TypeScript type. No markdown, no code fences, no commentary before or after the JSON:

{
  "hero": {
    "headline": "<one short line, ticker + the joke, lowercase, no em-dash>",
    "subhead": "<one supporting sentence, who it's for, why now>",
    "ctaText": "<2-4 words, e.g. 'buy on pump.fun' or 'join the cult'>",
    "ctaHref": ${pumpFunUrl ? `"${pumpFunUrl}"` : '"<omit if no contract>"'}
  },
  "lore": [
    "<paragraph 1: origin, 60-100 words REQUIRED. concrete: a specific moment, place, or joke. no 'in the world of...'>",
    "<paragraph 2: deepening, 60-100 words REQUIRED. the joke gets weirder or the world gets sharper. specific detail beats abstract concept>",
    "<paragraph 3: now, 50-90 words REQUIRED. why the launch matters today. can end on a shitpost line, not a mission statement>"
  ],
  "tokenomics": [
    {"label": "<choose a label that fits the coin, e.g. Supply, Fair launch, Dev bag, Liquidity, Burn, Tax>", "value": "<concrete value, e.g. 1B total>"},
    {"label": "<label 2>", "value": "<value>"},
    {"label": "<label 3>", "value": "<value>"},
    {"label": "<label 4>", "value": "<value>"}
  ],
  "howToBuy": [
    {"stepNumber": 1, "title": "Get SOL", "body": "<one sentence, ≤20 words, on getting SOL into wallet>"},
    {"stepNumber": 2, "title": "Open pump.fun", "body": "<one sentence, ≤20 words, on the link or search>"},
    {"stepNumber": 3, "title": "Swap to $${ticker}", "body": "<one sentence, ≤20 words, slippage or route>"},
    {"stepNumber": 4, "title": "<final step, e.g. 'Hold', 'Post about it', 'Send to the group'>", "body": "<one sentence, ≤20 words, the ongoing posture>"}
  ],
  "faq": [
    {"question": "<a question a real buyer would actually type, lowercase ok>", "answer": "<30-70 words REQUIRED, one paragraph, direct answer first>"},
    {"question": "<question 2>", "answer": "<answer 2, 30-70 words>"},
    {"question": "<question 3>", "answer": "<answer 3, 30-70 words>"},
    {"question": "<question 4>", "answer": "<answer 4, 30-70 words>"}
  ],
  "cta": {
    "headline": "<short closing call, 3-8 words>",
    "subhead": "<optional one-line supporting, or omit>",
    "buttonText": "<2-4 words>",
    "href": ${pumpFunUrl ? `"${pumpFunUrl}"` : '"<omit if no contract>"'}
  },
  "riskDisclosure": "Memecoin. Not financial advice. Only trade what you can afford to lose."
}

Hard rules:
- EXACTLY 3 lore paragraphs, 4 tokenomics rows, 4 how-to-buy steps, 4 FAQ items. Not 3, not 5.
- LENGTH MATTERS: lore paragraphs UNDER 40 words are rejected. FAQ answers UNDER 20 words are rejected. Terse is good, but bare is bad. If you feel like you might be padding, you're at the right length. If it looks like a subtitle, add more.
- All strings single-line. No \\n inside values, no unescaped quotes.
- NO em-dashes anywhere. Use commas, periods, or hyphens instead.
- NO exclamation marks. Crypto CT despises them.
- NO Title Case in headlines. Lowercase or sentence case only.
- NO AI-isms: "delve", "leverage", "robust", "comprehensive", "tapestry", "elevate", "unleash", "seamless", "cutting-edge", "harness", "ecosystem" (as metaphor), "in the world of", "in an era where", "meets", hollow "real"/"truly", three-of-a-kind constructions ("built for x, y, and z").
- NO shill words: "moon", "gem", "hidden gem", "alpha", "1000x", "next 100x", "revolutionary", "game-changing", "future of X".
- Reference what's CONCRETE in the memecoin brief. If the brief says "vibe is cat cult", write cat cult specifics, not generic "community". Do not invent tokenomics numbers if none given, use "fair launch" language instead.
- NO invented specific numbers: no burn rates, market caps, price targets, or supply figures unless they appear verbatim in the brief. For tokenomics rows, if a specific number isn't in the brief write "tbd" or "fair launch" rather than fabricating "95% burn" or "1B supply".
- If a field would be empty or generic filler, omit ctaHref/href entirely (do not include the key).
- riskDisclosure must always be present, verbatim.
- Output: JSON only. No prefix text. No code fence. Start with "{" and end with "}".`
}
