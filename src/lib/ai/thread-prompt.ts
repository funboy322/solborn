/**
 * Prompt builder for the AI-generated launch thread (X / Twitter).
 *
 * Output is a JSON object with 5-7 short tweets and 1-3 hashtags. Each tweet
 * already validated ≤280 chars by the API after parsing. Voice mirrors the
 * solborn warmup: lowercase, no AI-isms, one concrete reason per tweet.
 */

import type { ForgeAgent, GeneratedProject } from '../types'

export function buildThreadPrompt(project: GeneratedProject, agent: ForgeAgent): string {
  const memecoin = project.memecoinBrief
  const ticker = memecoin?.ticker?.toUpperCase() ?? project.name.toUpperCase().slice(0, 6)
  const pumpFunUrl =
    memecoin?.pumpFunUrl ||
    (memecoin?.contractAddress
      ? `https://pump.fun/coin/${memecoin.contractAddress}`
      : null)

  const memecoinBlock = memecoin
    ? `Memecoin brief:
- ticker: $${ticker}
- vibe: ${memecoin.vibe || '(unspecified)'}
- target community: ${memecoin.targetCommunity || '(unspecified)'}
- lore: ${memecoin.lore || '(unspecified)'}
- edge — why this not the next twenty launches: ${memecoin.edge || '(unspecified)'}
- buy link: ${pumpFunUrl ?? '(not yet launched)'}`
    : `Project: ${project.name} (${project.tagline ?? 'no tagline'}). ${project.description}`

  return `You are writing a launch thread for X (Twitter) about a Solana memecoin called "${project.name}" (ticker $${ticker}). An AI agent ("${agent.name}") helped shape the meme through a conversation. Now you're announcing the launch to crypto Twitter.

${memecoinBlock}

Agent voice: ${agent.personality || 'meme-fluent, vibes-first, sharp edge'}.

Return EXACTLY one JSON object. No markdown, no code fences, no prose before or after:

{
  "tweets": [
    "<tweet 1 — hook: ticker + what this is, one short sentence with a punch>",
    "<tweet 2 — lore: the joke / meta / story behind the coin>",
    "<tweet 3 — community: who this is for, where they hang out>",
    "<tweet 4 — tokenomics: fairness signals, supply, no pre-mine etc.>",
    "<tweet 5 — how to buy, with the pump.fun link if available>",
    "<tweet 6 — why now: the moment, the timing, the energy>",
    "<tweet 7 — closing call, retweet bait, one short final line>"
  ],
  "hashtags": ["<lowercase tag without #>", "<tag 2>", "<tag 3>"]
}

Hard rules:
- EXACTLY 7 tweets. Not 5, not 8.
- Each tweet ≤ 280 characters. Aim for 180-260 typically.
- Lowercase voice. No Title Case. No All Caps shouting.
- NO hashtags in tweet body — they go in the hashtags array.
- NO marketing AI-isms: avoid "delve", "leverage", "robust", "comprehensive", "tapestry", "elevate", "unleash", "seamless", "ecosystem" (as metaphor), em-dashes, hollow "real" / "truly" intensifiers, three-of-a-kind patterns.
- ONE concrete reason / image / number per tweet. No vague vibes.
- Tweet 5 MUST include the pump.fun link if buyLink is set, otherwise say "contract dropping soon" or similar.
- The thread reads like a builder posted it — not a press release. Builder-tone: confident, terse, slightly self-aware.
- hashtags: 1-3 entries, lowercase, no # prefix in the array (e.g. "solana", "memecoin", "${ticker.toLowerCase()}"). The thread doesn't need them in the body — they're metadata.
- Output: JSON only. No prefix text. No code fence. Start with "{" and end with "}".`
}
