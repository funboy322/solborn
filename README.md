<div align="center">

<img src="public/logo.png" alt="SolBorn" width="120" height="120" />

# SolBorn

### AI memecoin launchpad on Solana.

**Tell the agent your meme. It writes the lore, landing page, and a 7-tweet launch thread.**
**Claim `yourticker.solborn.xyz`. Share the URL. Ship the launch.**

[![Solana](https://img.shields.io/badge/Solana-mainnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-10B981?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/funboy322/solborn?style=for-the-badge&color=F59E0B)](https://github.com/funboy322/solborn/stargazers)

### 🌐 [**solborn.xyz**](https://solborn.xyz) — live now

[**🚀 Live Site**](https://solborn.xyz) · [**🔭 Discover**](https://solborn.xyz/discover) · [**🎮 Demo Path**](https://solborn.xyz/demo)

---

</div>

> **AI memecoin launchpad on Solana.**
> Chat with an AI agent about your meme: ticker, lore, vibe, target community. It writes a full landing page (lore + tokenomics + how-to-buy + FAQ) and a 7-tweet launch thread for X. Claim `yourticker.solborn.xyz` and share the public URL.

<br />

## 🔄 Pivot note (2026-06)

Originally built as an AI co-founder for Solana startups (Colosseum Frontier hackathon submission). After the hackathon, SolBorn pivoted to an **AI memecoin launchpad** — same agent engine, same Solana wallet stack, same semantic memory, but the agent now interviews you about your meme and ships a landing page + launch thread instead of a startup brief. Older sections of this README still describe the founder-flow architecture; the technology layer is unchanged, only the output is different.

<br />

## ✨ The pitch in one paragraph

Most memecoin launches die at the blank page: no lore, no landing, no thread. SolBorn flips it. The AI agent interviews you about your meme — ticker, vibe, lore, target community — and from those answers writes the landing page (lore paragraphs + tokenomics + how-to-buy + FAQ) and a 7-tweet launch thread in the agent's voice. You claim `yourticker.solborn.xyz`, share the URL on X, post the thread as replies. The agent still has semantic memory and still mints a Passport on-chain — that machinery is now the engine for memecoin lore instead of startup briefs.

<br />

## 🌐 Long-term vision

> **Shopify + AWS + App Store — but for AI agents.**

SolBorn is building the full infrastructure stack for AI agent creation, hosting, distribution, and monetization on Solana:

| Layer | What it means |
|:---|:---|
| 🏗️ **Creation** | Agent interviews you → builds YOUR personalized startup idea |
| 🪪 **Identity** | Agent Passport = on-chain proof of origin and conversation history |
| 🚀 **Distribution** | Product Arena — community backs the strongest agent-built products |
| 💰 **Monetization** | Creator marketplace: 70% creator / 30% SolBorn. Subscriptions, access passes, agent forks |
| ☁️ **Hosting** | Long-term: compute layer for deployed agents (the AWS angle) |

**Revenue model roadmap:**
- Phase 1 (now): `$SBORN` trading fees — 20% to contributors, 30% treasury, 50% dev
- Phase 2: Platform fee on product subscriptions and membership passes
- Phase 3: Agent hosting compute fees
- Phase 4: Arena placement and boosted visibility for stakers

**Rewards tie to actual contribution, not empty emissions.** Contribution score + staking weight + product impact = your share. No farming. No airdrop hunters.

<br />

## 🧬 The four stages

<table>
<tr>
<td align="center" width="25%">
<h3>👶</h3>
<b>Baby</b><br />
<sub>0–100 XP</sub><br /><br />
Curious about you.<br />Asks who you are, what you care about.
</td>
<td align="center" width="25%">
<h3>🧒</h3>
<b>Toddler</b><br />
<sub>100–300 XP</sub><br /><br />
Starts forming ideas.<br />Connects your interests to Solana opportunities.
</td>
<td align="center" width="25%">
<h3>🧑‍💻</h3>
<b>Teen</b><br />
<sub>300–700 XP</sub><br /><br />
Proposes specific projects.<br />Discusses tech stack, GTM, and your edge.
</td>
<td align="center" width="25%">
<h3>🚀</h3>
<b>Adult</b><br />
<sub>700+ XP</sub><br /><br />
Ships.<br />Full product brief + Launch Certificate on Solana devnet.
</td>
</tr>
</table>

<br />

## 🏗️ What's actually shipped

| System | Tech | Proof |
|---|---|---|
| 🧠 **Semantic memory** | Upstash Vector (BGE-M3 multilingual, EU1) | Facts extracted async via `after()`, agent recalls them weeks later |
| ⚡ **Streaming chat** | AI SDK v6 + Groq (`llama-3.3-70b`) | Edge streaming with fallback to `llama-3.1-8b-instant` |
| 🎓 **XP engine** | Custom grader + trait analyzer | Word count × quality × novelty — spam = 0 XP |
| 🪪 **NFT Passports** | Metaplex Core + dynamic OG artwork (Memo fallback) | Devnet NFT visible in Phantom and Magic Eden; each agent gets unique stage-themed art |
| 🚀 **Launch Certificate NFTs** | Metaplex Core with project metadata (Memo fallback) | Adult agents publish an on-chain NFT certificate with distinct artwork per project |
| 📧 **Email + wallet auth** | Privy embedded Solana wallets + Phantom adapter | Sign in with email/Google/Apple for an auto-provisioned Solana wallet, or connect Phantom. Both flows mint the same Passports |
| 🧾 **Product Arena** | Agent-generated brief + membership pass + votes | Adult agents turn conversations into product pages backed by staked Passport holders |
| 🪙 **$SBORN utility layer** | Staking v1 + per-wallet XP attribution | Stake-to-unlock access being tested before mainnet token locks |
| 🔋 **Energy system** | Client-side regen + wallet boost | 2 energy/min, connect wallet for refill |
| 🏆 **Achievements** | 20+ unlocks, XP bonuses | Real-time toast + screen-shake feedback |
| 🎬 **Demo mode** | `?demo=1` → ×50 XP, ∞ energy | Lets judges hit Adult in 3–4 messages |

<br />

## 🚀 Try it in 30 seconds

For judges, the guided path is [**solborn.xyz/demo**](https://solborn.xyz/demo). It links the whole loop:
Forge → Passport → Adult agent → Product Page → Launch Certificate → Product Arena.
If the Arena is empty, use **Load sample product** on the demo page to seed a local example instantly.

```bash
# 1. Clone & install
git clone https://github.com/funboy322/solborn.git
cd solborn
npm install

# 2. Copy env template
cp .env.example .env.local
# Fill in: GROQ_API_KEY, UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN
# Optional but recommended: NEXT_PUBLIC_HELIUS_RPC

# 3. Run
npm run dev
```

Open <http://localhost:3000> → click **Create Agent** → connect Phantom (devnet) → let it interview you.
Or skip the setup and try the live version at [**solborn.xyz**](https://solborn.xyz).
Append `?demo=1` to any URL for a ×50 XP speed-run (hackathon demo mode).

<br />

## 🧠 How the loop works

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                         YOU                                       │
 │          answer the agent's questions about yourself              │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  your skills, interests, problems
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │   Agent interviews you → builds YOUR personalized startup idea    │
 │   xp-calculator.ts  →  grades depth and quality of conversation  │
 │   trait-analyzer.ts →  shapes agent personality around your input │
 │   memory-engine.ts  →  stores facts → Upstash Vector (async)     │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  XP gained → stage crossed?
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │  core-mint.ts  →  Metaplex Core NFT Passport on Solana devnet    │
 │  /api/nft-metadata/og →  unique stage-themed artwork per agent   │
 │  Sign with Phantom OR Privy embedded wallet (email login)        │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  stage === 'adult'?
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │   /api/agent/generate  →  LLM produces YOUR project spec         │
 │   mintCoreLaunchCertificate() → real Launch NFT in Explorer + ME │
 │   Product Arena → community backs the strongest ideas            │
 └──────────────────────────────────────────────────────────────────┘
```

<br />

## 📦 Tech stack

<div align="center">

| Frontend | AI & Memory | Solana / Auth |
|:---:|:---:|:---:|
| Next.js 16 + Turbopack | AI SDK v6 | **Metaplex Core** (NFTs) |
| React 19 | Groq (Llama 3.3 70B) | **Privy** (embedded wallets) |
| Tailwind v4 | Upstash Vector | `@solana/web3.js` + UMI |
| Framer Motion | BGE-M3 embeddings | Phantom wallet-adapter |
| Zustand v5 + persist | `after()` background tasks | Helius / devnet RPC |

</div>

<br />

## 🤝 Frontier hackathon — sponsor integrations

| Sponsor | How SolBorn uses it | Where in code |
|---|---|---|
| **Phantom** (primary) | Default wallet adapter for crypto-native users — connects, signs, mints | `src/components/wallet/WalletProvider.tsx`, `WalletButton.tsx` |
| **Privy** (secondary) | Email / Google / Apple login → auto-provisioned Solana embedded wallet → can mint Passport without ever installing Phantom. Removes the biggest UX barrier for non-crypto founders. | `src/components/wallet/PrivyProvider.tsx`, `src/lib/hooks/useSolanaSigner.ts` |
| **Metaplex** (secondary) | Agent Passports and Launch Certificates are real Metaplex Core NFTs with dynamic stage-themed artwork generated per agent via `next/og`. Visible in Phantom and Magic Eden. | `src/lib/solana/core-mint.ts`, `src/app/api/nft-metadata/og/route.tsx` |

Both Privy and Phantom flows route through a single `useSolanaSigner()` hook, so the rest of the app doesn't care which auth path the user took. Same code mints the same NFT.

<br />

## 🗂️ Repo layout

```
solborn/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agent/chat/      → streaming chat + XP grading
│   │   │   ├── agent/generate/  → LLM → personalized project spec
│   │   │   ├── blinks/[id]/     → Solana Actions endpoint
│   │   │   └── nft-metadata/    → metadata route
│   │   ├── forge/[id]/          → agent page (chat + stats + deploy)
│   │   ├── products/            → Product Arena
│   │   ├── staking/             → staking v1 simulation
│   │   └── page.tsx             → landing
│   ├── components/agent/        → ChatInterface, ProjectGenerator, ...
│   ├── lib/
│   │   ├── ai/                  → prompts, xp-calculator, trait-analyzer
│   │   ├── solana/on-chain.ts   → Passport + Launch Certificate memos
│   │   ├── memory/              → Upstash Vector wrapper
│   │   └── demo-mode.ts         → ×50 XP hackathon mode
│   └── store/                   → zustand slices (agents, achievements)
├── scripts/                     → helper scripts
```

<br />

## 💰 $SBORN Token

**$SBORN is live on pump.fun. The product utility layer is in development.**

> **CA:** `3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump`
> **Buy:** [pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump](https://pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump)

Standard pump.fun bonding curve launch. No pre-mine, no team allocation, no airdrop. Every token in circulation came from the curve.

**Dev tokens (the initial creator-buy) are locked until end of 2026.**

### Trading fee allocation

Pump.fun routes a portion of every swap to the creator wallet. Those incoming fees are split:

<div align="center">

| Allocation | Share | Use |
|:---|:---:|:---|
| 🧑‍💻 **Development** | **80%** | Founder compensation, infrastructure (Claude, Vercel, RPC nodes), future security audit, cost recovery for the build phase |
| 🎁 **Community** | **20%** | Distributed to people who used the platform, gave feedback, or helped the project grow. Manual today via [solborn.xyz/rewards](https://solborn.xyz/rewards). Planned to move to programmatic on-chain distribution at mainnet. |

</div>

Honest framing: this is a solo project. "Development" is one bucket because in practice the founder, the infrastructure, and the audit fund all come from the same pool. The 20% community share is the clean line between operating budget and what gets returned to people who showed up early.

<br />

## 🎯 Roadmap

- [x] **Phase 1** — baseline chat + XP + stages
- [x] **Phase 2** — semantic memory (Upstash Vector)
- [x] **Phase 3** — Agent Passport memo minting
- [x] **Phase 4** — contributor XP attribution
- [x] **Phase 5** — Launch Certificate finale
- [x] **Phase 6** — demo mode (`?demo=1`)
- [x] **Phase 7** — staking v1 simulation for Passport-gated utility
- [x] **Phase 8** — agent-generated Product Pages + membership pass v1
- [x] **Phase 9** — Product Arena + stake-gated backing simulation
- [ ] **Phase 10** — mainnet deployment + real SPL staking + first contributor reward distribution
- [ ] **Phase 11** — creator marketplace: product subscriptions + 70/30 fee split
- [ ] **Phase 12** — agent hosting layer (compute fees, persistent deployments)

<br />

## 🛡️ Honest caveats

- **Devnet only** at launch. Agent Passports, Launch Certificates, and Memo txs are devnet. Mainnet is Phase 10.
- **Groq free-tier limits** apply. Chat has a Llama 3.1 8B fallback when 70B is throttled.
- **Minting costs devnet SOL**. Passports and Launch Certificates are Memo transactions — wallet needs a small devnet balance for fees.
- **Staking v1 is a simulation layer.** Prepares access rules and UX before a real SPL token lock program is deployed.
- **Not financial advice.** `$SBORN` is an experimental community token with a planned utility wrapper, not a security.

<br />

## 🧑‍🚀 Built by

One person. One weekend. Claude Max as a pair programmer. Submitted to the **Colosseum Frontier Hackathon 2026**.

If you're a judge: open [**solborn.xyz/demo**](https://solborn.xyz/demo), mint an Agent Passport, let the agent interview you, raise it to Adult (~2 min with demo mode), generate its product page, and publish a Launch Certificate. The whole loop is under 3 minutes and the key milestones are real Solana devnet transactions.

<br />

<div align="center">

### Talk. Build. Ship.

⭐ Star the repo if this made you smile.

<sub>Made with caffeine and <code>useEffect</code>.</sub>

</div>
