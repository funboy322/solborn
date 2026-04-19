# $BORN — pump.fun launch playbook

Living document. Update as plans evolve. Everything here assumes pump.fun mechanics as of April 2026 (Project Ascend V1, Fee Sharing V1, PumpSwap graduation).

---

## 1. Token identity

| Field | Value |
|---|---|
| **Name** | SolBorn |
| **Ticker** | `$BORN` |
| **Image** | `public/logo.png` (the same one on the site) |
| **Website** | `https://solborn.xyz` |
| **Telegram** | *(create empty tg before launch — trenches bots check)* |
| **Twitter** | `@solborn_xyz` |

**Alt tickers** if `$BORN` is taken: `$SOLBORN`, `$RAISE`, `$FORGE`, `$HATCH`.

### Description (goes into pump.fun metadata, ~280 chars)

```
SolBorn — raise an AI founder on Solana. Teach it, evolve it, watch it ship a live Blink. Every stage mints a cNFT to your wallet. Train others' agents, earn royalty splits. Working devnet product: https://solborn.xyz
```

This matters: most pump.fun slop has garbage descriptions. Ours points to a **working on-chain product**. Snipers who read descriptions (a minority but they move money) will notice.

---

## 2. Tokenomics & fee split

Use pump.fun's **Fee Sharing V1** (Jan 2026) at creation. Split across 3 wallets from day one — this is public, visible on pump.fun, and becomes part of the pitch ("fees are pre-committed, not rugged later").

| Wallet | Share | Purpose |
|---|---|---|
| `dev` (your main) | **50%** | Founder compensation + ops |
| `treasury` (separate) | **30%** | Runway — Claude Max, Vercel, RPC, future audits |
| `trainers` (program-owned) | **20%** | Reserved for the trainer-royalty airdrop (Phase 7) |

The 20% trainer wallet is the narrative hook. Post-launch, publish a blog/X post: **"20% of all trading fees are earmarked for the humans who taught the AI agents. Fee-share wallet is on-chain: `<address>`"**. This is the real differentiator vs 99% of memecoins — fees with a publicly-committed use case beyond the founder's pocket.

### Why no pre-mine / team allocation?

Pump.fun doesn't support it. All supply sits on the bonding curve. Your "allocation" = your initial buy + everything you earn from creator fees over time. Don't try to fake team tokens via alt wallets — trackers (GMGN, Trenches, Photon) flag this instantly and it tanks sentiment.

---

## 3. Launch sequence (same day)

**Prerequisites (do before launch day):**

- [ ] SolBorn deployed on Vercel with `NEXT_PUBLIC_BUBBLEGUM_TREE` + Upstash env vars
- [ ] Smoke test from cold wallet: create agent → chat → evolve → receive cNFT in Phantom → ship Blink → open in dial.to → tip works
- [ ] Record **60-sec demo video** of the above flow (screen capture, muted music, captions)
- [ ] `@solborn_xyz` X account has ≥5 posts with the product (teasers, screenshots) — dead accounts get ignored
- [ ] 3 Solana-native dev friends lined up to quote-tweet the launch post in first hour
- [ ] `treasury` + `trainers` wallets created, funded with 0.01 SOL each (so they exist on-chain)

**Launch T+0 (aim for Tue–Thu, 14:00–18:00 UTC = US morning):**

1. Open pump.fun create flow.
2. Fill metadata exactly as above.
3. **Enable Fee Sharing** → paste the 3 wallet addresses with 50/30/20 split.
4. **Don't enable Mayhem Mode.** With a real product, organic activity beats AI-simulated activity.
5. Initial buy: **0.8 SOL** from dev wallet (same tx as creation).
6. T+30s: secondary buy **0.3 SOL** from a clean wallet you control (not linked to dev) — looks like early organic interest, not a bundle.
7. T+2min: post launch thread (template below) from `@solborn_xyz`. Reply with demo video as second tweet.
8. T+5min: DM the 3 pre-arranged friends to quote-tweet with their genuine take.
9. T+1h: drop the thread link in 3–5 Solana builder Discords / Telegrams you're already in. Don't shill in groups you've never participated in — gets you muted and hurts the token.

---

## 4. Launch X thread

Pin this after posting. 5 tweets, each stands alone if torn out of thread.

**Tweet 1 (hook + image/video):**
```
you can now raise an AI founder on solana.

teach it from babbling baby → shipping adult.
every stage = compressed NFT in your wallet.
when it graduates, it publishes a live Blink.

$BORN is live on pump.fun 👇
[attach 60s demo video]
```

**Tweet 2 (proof it's real):**
```
this isn't a meme token.

→ semantic memory (Upstash Vector) — your agent remembers you across sessions
→ cNFTs via Metaplex Bubblegum on devnet — real on-chain
→ Solana Actions Blinks — tip any adult agent from phantom
→ multi-trainer royalty split

live: solborn.xyz
```

**Tweet 3 (token mechanics):**
```
$BORN fee split (on-chain, verifiable on pump.fun):

50% dev — founder + ops
30% treasury — infra, audits, future mainnet
20% trainer royalty pool — airdropped to humans who train the AI agents

no team allocation. no pre-mine. everything on the curve.
```

**Tweet 4 (the trainer royalty hook):**
```
the whole thesis: teaching an AI agent should be upside, not charity.

every XP you contribute to someone's agent is tracked on-chain.
20% of $BORN trading fees flow to a trainer wallet and get distributed to top trainers quarterly.

work becomes equity.
```

**Tweet 5 (CTA):**
```
try it before you ape:
→ solborn.xyz
→ connect phantom
→ raise your first agent in 2 min
→ then decide if $BORN is worth it

pump.fun link: [insert after launch]
```

---

## 5. First 48h playbook

- **Price target:** don't try to force graduation ($69k mcap). With Dynamic Fees V1, your revenue is *highest* between **420–1470 SOL mcap** (~$40k–140k). That's the sweet spot to stay in. Don't market "graduation hype" — market product usage.
- **Buy your own dip, twice.** If price retraces 50%+ in first 24h and your treasury has SOL, buy back 0.3–0.5 SOL. This is not wash trading — you're a holder defending your own bag. It signals conviction and earns you fees on the bounce.
- **Post update thread every 12h** with a concrete metric: "12h in — X new agents raised, Y cNFTs minted, Z blinks shipped." Numbers on-chain verifiable = trust.
- **Reply to every reasonable skeptic.** Ignore trolls. Most "is this a rug?" questions are genuine and one clear answer converts the person.

---

## 6. Honest risks & kill-switches

- **Most likely outcome:** $500–2000 made over ~1 week from creator fees + initial buy appreciation, then slow fade. That still covers Claude Max for 5–10 months.
- **Worst case:** total launch cost ≤ **2 SOL + 0.02 SOL creation + 3h of your time** ≈ $400 down. Manageable.
- **Kill switch:** if 24h volume is under 5 SOL and no organic followers, stop shilling. Let it die quietly. Don't throw good money after bad. A dead token in your history is fine if the product keeps shipping — you launch v2 later with a different ticker.
- **Don't:** enable Mayhem Mode, use Jito bundles, buy your token from >5 fresh wallets, promise price targets, promise airdrops on a timeline you can't keep.

---

## 7. Post-launch integration (Phase 7 of the main plan)

Once the token survives week 1, wire it back into the product:

1. Show **$BORN balance** in the forge header (add a small balance readout next to the wallet address).
2. Add a **"Trainer payout"** section on `/forge/[id]` that calculates `trainer.xpContributed / totalXP * fees_accumulated` as a live estimate of their share.
3. First quarterly trainer airdrop (manual multisig tx from the trainer wallet → top N trainers by XP on-chain).
4. Consider making some premium features (e.g., extra memory slots, custom cNFT art) gated by holding ≥1% of $BORN supply.

Every one of these makes the token *used* inside the product, not just traded.

---

## 8. Open questions to answer before launch

- [x] ~~Custom domain or stay on `.vercel.app`?~~ → **solborn.xyz** is live
- [ ] Telegram community? (pump.fun trench bots index tg links; worth 10 min of setup)
- [ ] Record demo video with voiceover or captions-only? (captions = more shareable, no accent concerns)
- [ ] Do we want a mainnet deployment ready at launch, or stay on devnet + promise mainnet as a roadmap item? (devnet is honest and cheaper; most pump.fun tokens have zero product, so devnet-with-product still beats 99% of them)
