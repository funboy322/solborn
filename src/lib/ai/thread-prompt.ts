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

  return `You are writing a launch thread for X (Twitter) about a Solana memecoin called "${project.name}" (ticker $${ticker}). An AI agent ("${agent.name}") helped shape the meme. You are announcing to crypto Twitter (CT). This is a shitpost thread with structure, not a press release with jokes.

${memecoinBlock}

Agent voice: ${agent.personality || 'meme-fluent, vibes-first, sharp edge'}. But the OVERALL register is CT-native: lowercase, terse, self-aware, one joke or one number per tweet, occasionally an emoji only when it lands.

Good tweet-1 examples (imitate register, not content):
  "$NGMI just launched. no premine. no team bag. no roadmap. only vibes."
  "the cat is CEO. $GIGACAT is live on pump.fun. get in or don't."
  "wojak was right about everything. $COPE. live now."

Bad tweet-1 examples (do not do this):
  "🚀🚀🚀 Introducing $MOON, the next 1000x gem! 🚀🚀🚀"
  "We're excited to announce the launch of..."

Return EXACTLY one JSON object. No markdown, no code fences, no prose before or after:

{
  "tweets": [
    "<tweet 1: hook, must start with $${ticker}, one sentence, punchy, ≤200 chars>",
    "<tweet 2: lore, the joke or meta behind the coin, concrete detail>",
    "<tweet 3: community, who this is for, a specific archetype not 'everyone'>",
    "<tweet 4: fairness signals, supply or launch mechanics in one line>",
    "<tweet 5: how to buy, MUST include the pump.fun link if buyLink is set>",
    "<tweet 6: why now, the moment, one image or number>",
    "<tweet 7: closing, short, retweet-worthy, no CTA cliches>"
  ],
  "hashtags": ["<lowercase tag without #>", "<tag 2 or omit>", "<tag 3 or omit>"]
}

Hard rules:
- EXACTLY 7 tweets. Not 5, not 8.
- LENGTH TARGETS:
    tweet 1: 60-160 chars. must contain the hook and the ticker, not just "$X is live".
    tweets 2-6: 60-200 chars each. one concrete image, joke, or number.
    tweet 7: 30-120 chars. can be shorter, but not one-word.
  Terse is good. Bare is bad. If a tweet is a single 4-word sentence, expand it.
- Tweet 1 MUST start with the ticker: $${ticker}.
- Tweet 5 MUST include the pump.fun link verbatim if buyLink is set (${pumpFunUrl ?? 'not set — write "contract dropping soon" style'}). Otherwise say "contract dropping soon" style.
- Lowercase voice throughout. No Title Case. No All Caps shouting.
- NO em-dashes anywhere. Use commas, periods, hyphens.
- NO exclamation marks. Zero.
- NO emojis in tweet 1. Later tweets may use one emoji if it genuinely lands, but zero emojis is fine and often better.
- NO hashtags in tweet bodies (they go in the hashtags array).
- NO shill vocabulary: "moon", "gem", "hidden gem", "alpha", "1000x", "next 100x", "revolutionary", "game-changing", "future of X", "don't miss out", "get in early".
- NO invented specific numbers: no burn rates, market caps, price targets, or supply figures unless they appear verbatim in the brief. If unknown, say "tbd" or omit. Do not write "95% burn rate" or "1B supply" if the brief doesn't say so.
- NO AI-isms: "delve", "leverage", "robust", "seamless", "ecosystem" (metaphor), "in an era where", hollow "real"/"truly" intensifiers, three-of-a-kind constructions.
- ONE concrete reason, image, or number per tweet. No vague vibes.
- hashtags: 1-3 entries, lowercase, no # prefix in the array (e.g. "solana", "memecoin", "${ticker.toLowerCase()}").
- Output: JSON only. No prefix text. No code fence. Start with "{" and end with "}".`
}
