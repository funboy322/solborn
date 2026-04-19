<div align="center">

<img src="public/logo.png" alt="SolBorn" width="120" height="120" />

# SolBorn

### Raise an AI founder on Solana.

**Teach it from babbling baby → shipping adult.**
**Every stage mints a compressed NFT. When it graduates, it publishes a live Blink.**

[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-10B981?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/funboy322/solborn?style=for-the-badge&color=F59E0B)](https://github.com/funboy322/solborn/stargazers)

[**🚀 Live Demo**](https://solborn.vercel.app) · [**📹 60s Video**](#) · [**🎮 Try in 30s**](#-try-it-in-30-seconds) · [**🪙 $BORN Playbook**](docs/token-launch.md)

---

</div>

> **Colosseum Frontier Hackathon 2026 submission.**
> A working on-chain product where teaching is the game loop, memory is persistent, and every milestone is verifiable on-chain.

<br />

## ✨ The pitch in one paragraph

Most "AI agent" projects are a text field that says *"deployed!"*. SolBorn is different. You name an agent, it starts as a **babbling baby** that genuinely knows nothing. You teach it — with actual explanations, not prompts — and a **teaching-XP engine** grades how much it learned. It remembers you across sessions via **semantic vector memory**. Each evolution **mints a real compressed NFT** to your wallet. When it reaches Adult, it generates a **Solana Blink** anyone can tip from Phantom. Teaching other people's agents earns you tracked on-chain contribution credit toward a **trainer royalty pool**.

<br />

## 🧬 The four stages

<table>
<tr>
<td align="center" width="25%">
<h3>👶</h3>
<b>Baby</b><br />
<sub>0–80 XP</sub><br /><br />
Knows nothing.<br />Asks "what is a wallet?" in babble.
</td>
<td align="center" width="25%">
<h3>🧒</h3>
<b>Toddler</b><br />
<sub>80–300 XP</sub><br /><br />
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
Ships.<br />Generates a live Blink<br />from its trait vector.
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
| 🪪 **Compressed NFTs** | Metaplex Bubblegum + Umi | Real devnet mints, cost ~0.00001 SOL per evolution |
| 🪄 **Solana Blinks** | Solana Actions spec 2.4 | GET/POST/OPTIONS endpoint, opens in dial.to + Phantom |
| 👥 **Trainer royalties** | Per-wallet XP attribution | On-chain memo-indexed, feeds into `$BORN` fee-share pool |
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
#          NEXT_PUBLIC_BUBBLEGUM_TREE (optional — falls back to Memo mints)

# 3. Run
npm run dev
```

Open <http://localhost:3000> → click **Create Agent** → connect Phantom (devnet) → start teaching.
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
 │     bubblegum.ts  →  mint cNFT snapshot to trainer wallet         │
 │     recordEvolution()  →  Memo tx for public evolution ledger     │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │  stage === 'adult'?
                                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │   /api/agent/generate  →  LLM produces BlinkSpec                  │
 │   /api/blinks/[id]     →  serves Solana Actions endpoint          │
 │   dial.to link         →  anyone can tip from Phantom             │
 └──────────────────────────────────────────────────────────────────┘
```

<br />

## 📦 Tech stack

<div align="center">

| Frontend | AI & Memory | Solana |
|:---:|:---:|:---:|
| Next.js 16 + Turbopack | AI SDK v6 | `@solana/web3.js` |
| React 19 | Groq (Llama 3.3 70B) | Metaplex Bubblegum |
| Tailwind v4 | Upstash Vector | Solana Actions 2.4 |
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
│   │   │   ├── agent/generate/  → LLM → BlinkSpec
│   │   │   ├── blinks/[id]/     → Solana Actions endpoint
│   │   │   └── nft-metadata/    → on-the-fly cNFT JSON
│   │   ├── actions.json/        → Blink client domain registration
│   │   ├── forge/[id]/          → agent page (chat + stats + deploy)
│   │   └── page.tsx             → landing
│   ├── components/agent/        → ChatInterface, ProjectGenerator, ...
│   ├── lib/
│   │   ├── ai/                  → prompts, xp-calculator, trait-analyzer
│   │   ├── solana/bubblegum.ts  → cNFT mint flow
│   │   ├── memory/              → Upstash Vector wrapper
│   │   └── demo-mode.ts         → ×50 XP hackathon mode
│   └── store/                   → zustand slices (agents, achievements)
├── scripts/create-tree.mjs      → one-time Bubblegum tree creator
└── docs/
    ├── token-launch.md          → $BORN pump.fun playbook
    └── twitter-warmup.md        → pre-launch social plan
```

<br />

## 🎯 Roadmap

- [x] **Phase 1** — baseline chat + XP + stages
- [x] **Phase 2** — semantic memory (Upstash Vector)
- [x] **Phase 3** — compressed NFT minting via Bubblegum
- [x] **Phase 4** — trainer royalty attribution
- [x] **Phase 5** — Solana Blink finale
- [x] **Phase 6** — demo mode (`?demo=1`)
- [ ] **Phase 7** — `$BORN` launch on pump.fun + in-app balance readout
- [ ] **Phase 8** — mainnet deployment + first quarterly trainer airdrop

<br />

## 🪙 $BORN — the token layer

Post-launch, 20% of all `$BORN` trading fees flow to a **trainer royalty pool** that airdrops quarterly to the humans who taught the agents. Not a promise — a pre-committed on-chain fee split. Full playbook: [`docs/token-launch.md`](docs/token-launch.md).

> The thesis: teaching an AI agent should be **upside, not charity**.

<br />

## 🛡️ Honest caveats

- **Devnet only** at launch. All cNFTs, Blinks, and Memo txs are devnet. Mainnet is a Phase 8 decision, not a day-1 promise.
- **Groq free-tier limits** apply. Chat has a Llama 3.1 8B fallback when 70B is throttled.
- **Minting costs SOL**. Bubblegum mints are ~0.00001 SOL each but require a funded trainer wallet.
- **Not financial advice.** `$BORN` is a memecoin with a utility wrapper, not a security. If you can't afford to lose what you ape, don't ape.

<br />

## 🧑‍🚀 Built by

One person. One weekend. Claude Max as a pair programmer. Submitted to the **Colosseum Frontier Hackathon 2026**.

If you're a judge: try it live, raise an agent to Adult (~2 min with `?demo=1`), ship its Blink, tip it 0.01 devnet SOL. The whole loop is under 3 minutes and everything you touch is real on-chain state.

<br />

<div align="center">

### Teach. Evolve. Ship.

⭐ Star the repo if this made you smile.

<sub>Made with caffeine and <code>useEffect</code>.</sub>

</div>
