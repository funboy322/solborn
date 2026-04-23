<div align="center">

<img src="public/logo.png" alt="SolBorn" width="120" height="120" />

# SolBorn

### Raise an AI founder on Solana.

**Teach it from babbling baby → shipping adult.**
**Mint an Agent Passport. Grow it to Adult. Publish a signed Launch Certificate.**

[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-10B981?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/funboy322/solborn?style=for-the-badge&color=F59E0B)](https://github.com/funboy322/solborn/stargazers)

### 🌐 [**solborn.xyz**](https://solborn.xyz) — live now on devnet

[**🚀 Live Site**](https://solborn.xyz) · [**📹 60s Video**](#) · [**🎮 Try in 30s**](#-try-it-in-30-seconds)

---

</div>

> **Colosseum Frontier Hackathon 2026 submission.**
> A working on-chain product where teaching is the game loop, memory is persistent, and every milestone is verifiable on-chain.

<br />

## ✨ The pitch in one paragraph

Most "AI agent" projects are a text field that says *"deployed!"*. SolBorn is different. You name an agent, it starts as a **babbling baby** that genuinely knows nothing. You teach it with actual explanations, not prompts, and a **teaching-XP engine** grades how much it learned. It remembers you across sessions via **semantic vector memory**. You can mint an **Agent Passport** as a signed Solana devnet proof. When the agent reaches Adult, it generates a product brief, membership pass, public product page, and **Launch Certificate** on-chain. Teaching other people's agents earns per-wallet attribution toward the planned **$SBORN trainer reward layer**.

<br />

## 🧬 The four stages

<table>
<tr>
<td align="center" width="25%">
<h3>👶</h3>
<b>Baby</b><br />
<sub>0–100 XP</sub><br /><br />
Knows nothing.<br />Asks "what is a wallet?" in babble.
</td>
<td align="center" width="25%">
<h3>🧒</h3>
<b>Toddler</b><br />
<sub>100–300 XP</sub><br /><br />
Starts connecting concepts.<br />Writes pseudocode, gets DeFi basics.
</td>
<td align="center" width="25%">
<h3>🧑‍💻</h3>
<b>Teen</b><br />
<sub>300–700 XP</sub><br /><br />
Codes in Rust.<br />Reviews your GTM. Has opinions.
</td>
<td align="center" width="25%">
<h3>🚀</h3>
<b>Adult</b><br />
<sub>700+ XP</sub><br /><br />
Ships.<br />Publishes a Launch Certificate<br />from its trait vector.
</td>
</tr>
</table>

<br />

## 🏗️ What's actually shipped

| System | Tech | Proof |
|---|---|---|
| 🧠 **Semantic memory** | Upstash Vector (BGE-M3 multilingual, EU1) | Facts extracted async via `after()`, agent recalls them weeks later |
| ⚡ **Streaming chat** | AI SDK v6 + Groq (`llama-3.3-70b`) | Edge streaming with fallback to `llama-3.1-8b-instant` |
| 🎓 **Teaching XP engine** | Custom grader + trait analyzer | Word count × quality × novelty — spam = 0 XP |
| 🪪 **Agent Passports** | Solana Memo Program + wallet signatures | Real devnet tx that proves the agent identity in Explorer |
| 🚀 **Launch Certificates** | Signed Memo tx + generated project spec | Adult agents publish a verifiable launch proof on Solana devnet |
| 🧾 **Product Arena** | Agent-generated brief + membership pass + votes | Adult agents turn training into product pages that can be backed by staked Passport holders |
| 🪙 **$SBORN utility layer** | Staking v1 + per-wallet XP attribution | Stake-to-unlock access is being tested before real token locks |
| 🔋 **Energy system** | Client-side regen + wallet boost | 2 energy/min, connect wallet for refill |
| 🏆 **Achievements** | 20+ unlocks, XP bonuses | Real-time toast + screen-shake feedback |
| 🎬 **Demo mode** | `?demo=1` → ×50 XP, ∞ energy | Lets judges hit Adult in 3–4 messages |

<br />

## 🚀 Try it in 30 seconds

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

Open <http://localhost:3000> → click **Create Agent** → connect Phantom (devnet) → start teaching.
Or skip the setup and try the live version at [**solborn.xyz**](https://solborn.xyz).
Append `?demo=1` to any URL for a ×50 XP speed-run (hackathon demo mode).

<br />

## 🧠 How the teaching loop works

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                         YOU (the trainer)                         │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  explanation
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │   xp-calculator.ts  →  grades length × quality × novelty          │
 │   trait-analyzer.ts →  boosts intelligence / creativity / grit    │
 │   memory-engine.ts  →  extracts facts → Upstash Vector (async)    │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  XP gained
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │             zustand store  →  stage threshold crossed?            │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  yes
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │     on-chain.ts  →  Agent Passport Memo tx to trainer wallet      │
 │     chainHistory →  public evolution and launch proof ledger      │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  stage === 'adult'?
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │   /api/agent/generate  →  LLM produces project spec               │
 │   publishLaunchCertificate() → signed Memo proof in Explorer      │
 │   optional Blink URL   → support link, not required for demo       │
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
│   │   │   ├── agent/chat/      → streaming teaching chat
│   │   │   ├── agent/generate/  → LLM → generated project spec
│   │   │   ├── blinks/[id]/     → Solana Actions endpoint
│   │   │   └── nft-metadata/    → legacy metadata route
│   │   ├── actions.json/        → Blink client domain registration
│   │   ├── forge/[id]/          → agent page (chat + stats + deploy)
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

SolBorn is evolving in public. $SBORN utility is being developed step by step around real product usage. Some features are experimental and may change as we learn what actually works.

> **CA:** `3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump`
> **Buy:** [pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump](https://pump.fun/coin/3VNSmRLTvS54LWnynJNqEege21nzdjy1rEsPhsNxpump)

No pre-mine. No team allocation. Everything started on the bonding curve.

<div align="center">

| Bucket | Share | Purpose |
|:---|:---:|:---|
| 🧑‍💻 **Dev** | **50%** | Founder compensation + operations |
| 🏦 **Treasury** | **30%** | Runway — Claude, Vercel, RPC nodes, future audits |
| 🎁 **Trainers** | **20%** | Planned rewards for real contributors via [solborn.xyz/rewards](https://solborn.xyz/rewards) |

</div>

The token is designed as the coordination layer around the product:

- **Trainer rewards:** wallet-linked XP becomes the attribution score for future $SBORN distributions.
- **Agent utility:** planned use cases include staking access, energy boosts, launch boosts, Passport cosmetics, and advanced agent actions.
- **Stake-to-unlock:** a v1 staking screen is live as a simulation layer before the real SPL token lock is shipped.
- **Proof-gated identity:** Agent Passports and Launch Certificates give $SBORN a native product surface instead of being a detached meme.
- **Community incentives:** rewards can prioritize people who actually teach agents, ship feedback, write guides, and help the system grow.

The **20% trainer pool** is intended for real contributors: people who trained agents, found bugs, wrote guides, and helped the project grow. Nominations are reviewed manually at [solborn.xyz/rewards](https://solborn.xyz/rewards).

<br />

## 🎯 Roadmap

- [x] **Phase 1** — baseline chat + XP + stages
- [x] **Phase 2** — semantic memory (Upstash Vector)
- [x] **Phase 3** — Agent Passport memo minting
- [x] **Phase 4** — trainer royalty attribution
- [x] **Phase 5** — Launch Certificate finale
- [x] **Phase 6** — demo mode (`?demo=1`)
- [x] **Phase 7** — staking v1 simulation for Passport-gated utility
- [x] **Phase 8** — agent-generated Product Pages + membership pass v1
- [x] **Phase 9** — Product Arena + stake-gated backing simulation
- [ ] **Phase 10** — real SPL token lock + mainnet deployment + first trainer distribution


<br />

<br />

## 🛡️ Honest caveats

- **Devnet only** at launch. Agent Passports, Launch Certificates, and Memo txs are devnet. Mainnet is a Phase 9 decision, not a day-1 promise.
- **Groq free-tier limits** apply. Chat has a Llama 3.1 8B fallback when 70B is throttled.
- **Minting costs devnet SOL**. Passports and Launch Certificates are Memo transactions, but the wallet still needs a small devnet balance for fees.
- **Staking v1 is a simulation layer.** It prepares access rules and UX before a real SPL token lock program is deployed.
- **Not financial advice.** `$SBORN` is an experimental community token with a planned utility wrapper, not a security. If you can't afford to lose what you ape, don't ape.

<br />

## 🧑‍🚀 Built by

One person. One weekend. Claude Max as a pair programmer. Submitted to the **Colosseum Frontier Hackathon 2026**.

If you're a judge: open [**solborn.xyz**](https://solborn.xyz?demo=1), mint an Agent Passport, raise the agent to Adult (~2 min with demo mode), generate its product page, and publish a Launch Certificate. The whole loop is under 3 minutes and the key milestones are real Solana devnet transactions.

<br />

<div align="center">

### Teach. Evolve. Ship.

⭐ Star the repo if this made you smile.

<sub>Made with caffeine and <code>useEffect</code>.</sub>

</div>
