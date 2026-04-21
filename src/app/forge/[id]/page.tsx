'use client'
import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Cpu, Zap, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/agent/ChatInterface'
import { StageIndicator } from '@/components/agent/StageIndicator'
import { TraitRadar } from '@/components/agent/TraitRadar'
import { TrainersPanel } from '@/components/agent/TrainersPanel'
import { EvolutionModal } from '@/components/agent/EvolutionModal'
import { ProjectGenerator } from '@/components/agent/ProjectGenerator'
import { StreakBadge } from '@/components/agent/StreakBadge'
import { EnergyBar } from '@/components/agent/EnergyBar'
import { useForgeStore } from '@/lib/store'
import { STAGE_CONFIG, STAGE_ORDER, MAX_ENERGY, ENERGY_REFILL_AMOUNT } from '@/lib/constants'
import { mintAgentOnChain } from '@/lib/solana/on-chain'
import { recordEvolution } from '@/lib/solana/payment'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useWallet } from '@solana/wallet-adapter-react'
import { SFX } from '@/lib/sounds'
import type { AgentStage } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AgentPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const agents = useForgeStore((s) => s.agents)
  const updateAgentNFT = useForgeStore((s) => s.updateAgentNFT)
  const addChainCheckpoint = useForgeStore((s) => s.addChainCheckpoint)
  const refillEnergy = useForgeStore((s) => s.refillEnergy)
  const agent = agents.find((a) => a.id === id)

  const wallet = useWallet()
  const { publicKey, signTransaction, connected } = wallet

  const [minting, setMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [mintResult, setMintResult] = useState<{ mintAddress: string; txSignature: string; explorerUrl?: string } | null>(
    agent?.mintAddress ? { mintAddress: agent.mintAddress, txSignature: '' } : null
  )

  const [showEvolution, setShowEvolution] = useState(false)
  const [evolutionFrom, setEvolutionFrom] = useState<AgentStage>('baby')
  const [evolutionTo, setEvolutionTo] = useState<AgentStage>('toddler')
  const prevStageRef = useRef(agent?.stage)

  useEffect(() => {
    if (!agent) return
    const prev = prevStageRef.current
    if (prev && prev !== agent.stage) {
      const prevIdx = STAGE_ORDER.indexOf(prev)
      const newIdx = STAGE_ORDER.indexOf(agent.stage)
      if (newIdx > prevIdx) {
        setEvolutionFrom(prev)
        setEvolutionTo(agent.stage)
        setShowEvolution(true)
        SFX.evolve()
        // Record evolution on-chain (silent, optional)
        if (connected && publicKey && signTransaction) {
          recordEvolution(publicKey, signTransaction, {
            agentName: agent.name,
            fromStage: prev,
            toStage: agent.stage,
            xp: agent.xp,
          })
            .then((r) => {
              addChainCheckpoint(agent.id, {
                kind: 'evolve',
                stage: agent.stage,
                txSignature: r.txSignature,
                timestamp: Date.now(),
              })
            })
            .catch(() => {/* silent — optional */})
        }
      }
    }
    prevStageRef.current = agent.stage
  }, [agent?.stage, agent, connected, publicKey, signTransaction, addChainCheckpoint])

  useEffect(() => {
    if (agent?.mintAddress) {
      setMintResult({ mintAddress: agent.mintAddress, txSignature: '' })
    }
  }, [agent?.mintAddress])

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Agent not found</p>
          <Button onClick={() => router.push('/forge')}>Back to Forge</Button>
        </div>
      </div>
    )
  }

  const config = STAGE_CONFIG[agent.stage]
  const currentWallet = publicKey?.toBase58() ?? null
  const isOwner = !agent.walletAddress || (connected && currentWallet === agent.walletAddress)
  const isTrainingOther = !!agent.walletAddress && connected && currentWallet !== agent.walletAddress

  async function handleMintNFT() {
    if (!agent || minting || !connected || !publicKey || !signTransaction) return
    setMinting(true)
    setMintError(null)
    try {
      const memo = await mintAgentOnChain(agent, publicKey, signTransaction)
      const mintAddress = memo.mintAddress
      const txSignature = memo.txSignature
      const explorerUrl = memo.explorerUrl
      updateAgentNFT(agent.id, mintAddress)
      addChainCheckpoint(agent.id, {
        kind: 'mint',
        stage: agent.stage,
        txSignature,
        timestamp: Date.now(),
      })
      setMintResult({ mintAddress, txSignature, explorerUrl })
      SFX.mint()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transaction failed'
      setMintError(msg.includes('insufficient') ? 'Need SOL - use airdrop from wallet menu' : msg)
    } finally {
      setMinting(false)
    }
  }

  function handleRefillEnergy() {
    refillEnergy(agent!.id, ENERGY_REFILL_AMOUNT)
    SFX.xpGain()
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/forge')}>
            <ArrowLeft size={16} />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${config.color}20` }}>
              {agent.emoji}
            </div>
            <div>
              <h1 className="font-bold text-zinc-100 leading-none">{agent.name}</h1>
              <p className="text-xs text-zinc-500 mt-0.5">{agent.personality}</p>
            </div>
          </div>
          <WalletButton />
        </div>

        {isTrainingOther && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-xs text-emerald-300 flex items-center gap-2"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              You&apos;re <strong className="font-semibold">training</strong> this agent. Your XP contribution is tracked and splits future royalties.
            </span>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[calc(100vh-180px)]">
          {/* Sidebar */}
          <div className="space-y-4 lg:overflow-y-auto order-2 lg:order-1">

            {/* Stage */}
            <div className="glass p-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Progress</h2>
              <StageIndicator stage={agent.stage} xp={agent.xp} />
              <div className="mt-3 text-xs text-zinc-600">
                {(config.xpToNext as number) === Infinity
                  ? 'Max stage reached!'
                  : `${(config.xpToNext as number) - agent.xp} XP to next stage`}
              </div>
            </div>

            {/* Energy */}
            <div className="glass p-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Energy</h2>
              <EnergyBar energy={agent.energy ?? MAX_ENERGY} maxEnergy={agent.maxEnergy ?? MAX_ENERGY} />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">Regens 2/min passively</span>
                <button
                  onClick={handleRefillEnergy}
                  className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                >
                  <Zap size={10} />
                  Free Refill
                </button>
              </div>
            </div>

            {/* Traits */}
            <div className="glass p-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Skills</h2>
              <TraitRadar traits={agent.traits} color={config.color} />
            </div>

            {/* Trainers (multi-trainer) */}
            <TrainersPanel agent={agent} currentWallet={currentWallet} />

            {/* Stats */}
            <div className="glass p-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Stats</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Streak</span>
                  <StreakBadge streak={agent.streak ?? 0} />
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Best Streak</span>
                  <span className="font-mono text-zinc-200">{agent.bestStreak ?? 0}d</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total XP</span>
                  <span className="font-mono text-zinc-200">{agent.xp}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Interactions</span>
                  <span className="font-mono text-zinc-200">{agent.totalInteractions}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Achievements</span>
                  <span className="font-mono text-zinc-200">{agent.unlockedAchievements?.length ?? 0}</span>
                </div>
                {agent.walletAddress && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Owner</span>
                    <span className="font-mono text-emerald-400 text-[10px]">
                      {agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* On-chain Identity */}
            <div className="glass p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">On-chain</h2>
                {connected && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                )}
              </div>

              {agent.birthTxSignature && (
                <div className="mb-3 pb-3 border-b border-white/5">
                  <p className="text-[10px] text-zinc-600 mb-1">Birth TX</p>
                  <a
                    href={`https://explorer.solana.com/tx/${agent.birthTxSignature}?cluster=devnet`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <ExternalLink size={10} />
                    View on Explorer
                  </a>
                </div>
              )}

              {!connected ? (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 mb-2">Connect wallet to mint passport</p>
                  <WalletButton />
                </div>
              ) : mintResult ? (
                <div className="space-y-2">
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Agent Passport minted
                  </div>
                  <p className="text-xs text-zinc-600 font-mono break-all">{mintResult.mintAddress.slice(0, 24)}...</p>
                  {mintResult.txSignature && (
                    <a
                      href={mintResult.explorerUrl ?? `https://explorer.solana.com/tx/${mintResult.txSignature}?cluster=devnet`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <ExternalLink size={11} /> View on Explorer
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {mintError && <p className="text-xs text-rose-400">{mintError}</p>}
                  <Button variant="secondary" size="sm" className="w-full" loading={minting} onClick={handleMintNFT} disabled={!isOwner || minting}>
                    <Zap size={14} />
                    {minting ? 'Signing tx...' : 'Mint Agent Passport'}
                  </Button>
                  <p className="text-[10px] text-zinc-600 text-center">Writes agent proof to Solana devnet</p>
                </div>
              )}

              {(agent.chainHistory?.length ?? 0) > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">History</p>
                  {agent.chainHistory!.map((cp, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-600 capitalize">{cp.kind} → {cp.stage}</span>
                      <a
                        href={`https://explorer.solana.com/tx/${cp.txSignature}?cluster=devnet`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-violet-500 hover:text-violet-400"
                      >
                        tx ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {agent.stage === 'adult' && <ProjectGenerator agent={agent} />}

            {/* Abilities */}
            <div className="glass p-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Abilities</h2>
              <div className="space-y-1.5">
                {config.abilities.map((ability) => (
                  <div key={ability} className="text-xs text-zinc-400 flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    {ability}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 glass overflow-hidden flex flex-col order-1 lg:order-2 min-h-[60vh] lg:min-h-0">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2" style={{ background: `${config.color}08` }}>
              <Cpu size={14} style={{ color: config.color }} />
              <span className="text-sm font-medium" style={{ color: config.color }}>{config.label}</span>
              <span className="text-xs text-zinc-600 ml-auto">{config.description}</span>
            </div>
            <div className="flex-1 min-h-0">
              <ChatInterface agent={agent} />
            </div>
          </div>
        </div>
      </div>

      <EvolutionModal
        open={showEvolution}
        fromStage={evolutionFrom}
        toStage={evolutionTo}
        agentName={agent.name}
        agentEmoji={agent.emoji}
        onClose={() => setShowEvolution(false)}
      />
    </main>
  )
}
