<div align="center">

<img src="public/logo.png" alt="SolBorn" width="120" height="120" />

# SolBorn

### Your AI co-founder on Solana.

**Tell it who you are. It finds your startup idea.**
**Mint an Agent Passport. Grow it to Adult. Publish a signed Launch Certificate.**

[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-10B981?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/funboy322/solborn?style=for-the-badge&color=F59E0B)](https://github.com/funboy322/solborn/stargazers)

### 🌐 [**solborn.xyz**](https://solborn.xyz) — live now on devnet

[**🚀 Live Site**](https://solborn.xyz) · [**🎮 Demo Path**](https://solborn.xyz/demo) · [**📹 60s Video**](#)

---

</div>

> **Colosseum Frontier Hackathon 2026 submission.**
> A working on-chain product where your AI co-founder interviews you, builds your personalized startup idea, and every milestone is verifiable on Solana devnet.

<br />

## ✨ The pitch in one paragraph

Most "AI agent" projects hand you a blank text box and say *"start prompting!"*. SolBorn is different. You don't teach the agent — **it interviews you**. It asks about your skills, interests, what problems you see in the market. Based on your answers, it autonomously builds a personalized Solana startup idea tailored to who you are. As the conversation grows, so does the agent: it earns XP, evolves through stages, remembers you across sessions via **semantic vector memory**, and mints an **Agent Passport** as a signed on-chain proof of its origin. When it reaches Adult, it ships a full product brief, public product page, and **Launch Certificate** on Solana devnet. You end up not just with a chatbot — but with a co-founder that genuinely knows you.

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

**Rewards are tied to real value, not empty emissions.** Contribution score + staking weight + product impact = your share. No farming. No airdrop hunters.

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
| 🪪 **Agent Passports** | Solana Memo Program + wallet signatures | Real devnet tx that proves the agent identity in Explorer |
| 🚀 **Launch Certificates** | Signed Memo tx + generated project spec | Adult agents publish a verifiable launch proof on Solana devnet |
| 🧾 **Product Arena** | Agent-generated brief + membership pass + votes | Adult agents turn conversations into product pages backed by staked Passport holders |
| 🪙 **$SBORN utility layer** | Staking v1 + per-wallet XP attribution | Stake-to-unlock access being tested before real token locks |
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
 │     on-chain.ts  →  Agent Passport Memo tx on Solana devnet      │
 │     chainHistory →  public evolution and launch proof ledger     │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  stage === 'adult'?
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │   /api/agent/generate  →  LLM produces YOUR project spec         │
 │   publishLaunchCertificate() → signed Memo proof in Explorer     │
 │   Product Arena → community backs the strongest ideas            │
 └──────────────────────────────────────────────────────────────────┘
```

<br />

## 📦 Tech stack

<div align="center">

| Frontend | AI & Memory | Solana |
|:---:|:---:|:---:|
| Next.js 16 + Turbopack | AI SDK v6 | `@solana/web3.js` |
| React 19 | Groq (Llama 3.3 70B) | SPL Memo Program |
| Tailwind v4 | Upstash Vector | Helius/devnet RPC |
| Framer Motion | BGE-M3 embeddings | Umi + wallet adapter |
| Zustand v5 + persist | `after()` background tasks | SPL Memo |

</div>

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

No pre-mine. No team allocation. Everything started on the bonding curve.

<div align="center">

| Bucket | Share | Purpose |
|:---|:---:|:---|
| 🧑‍💻 **Dev** | **50%** | Founder compensation + operations |
| 🏦 **Treasury** | **30%** | Runway — Claude, Vercel, RPC nodes, future audits |
| 🎁 **Contributors** | **20%** | Manually distributed to real contributors via [solborn.xyz/rewards](https://solborn.xyz/rewards) |

</div>

The **20% contributor pool** goes to real users: people who found ideas through the platform, gave feedback, helped others, and helped the project grow. Nominations reviewed manually at [solborn.xyz/rewards](https://solborn.xyz/rewards).

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
