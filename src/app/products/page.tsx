'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSolanaSigner } from '@/lib/hooks/useSolanaSigner'
import { ArrowLeft, ExternalLink, FlaskConical, Lock, Medal, Rocket, ShieldCheck, Vote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useForgeStore } from '@/lib/store'
import {
  formatSborn,
  getActiveStakeForWallet,
  getStakeVoteWeight,
  STAKING_MIN_SBORN,
  STAKING_MIN_USD,
} from '@/lib/staking'
import type { ForgeAgent, GeneratedProject, ProductVote } from '@/lib/types'

type ProductEntry = {
  agent: ForgeAgent
  project: GeneratedProject
  totalWeight: number
  voters: number
  myVote?: ProductVote
}

function rankLabel(index: number): string {
  if (index === 0) return 'Leader'
  if (index === 1) return 'Runner-up'
  if (index === 2) return 'Rising'
  return `Rank ${index + 1}`
}

export default function ProductsArenaPage() {
  const router = useRouter()
  const { publicKey, connected } = useSolanaSigner()
  const walletAddress = publicKey?.toBase58() ?? null
  const agents = useForgeStore((s) => s.agents)
  const stakePositions = useForgeStore((s) => s.stakePositions)
  const productVotes = useForgeStore((s) => s.productVotes ?? [])
  const voteForProduct = useForgeStore((s) => s.voteForProduct)
  const seedDemoProduct = useForgeStore((s) => s.seedDemoProduct)
  const [votedProductId, setVotedProductId] = useState<string | null>(null)

  const activeStake = getActiveStakeForWallet(stakePositions, walletAddress)
  const voteWeight = getStakeVoteWeight(activeStake)
  const ownedPassport = useMemo(() => {
    if (!walletAddress) return null
    return agents.find(
      (agent) =>
        agent.mintAddress &&
        (agent.walletAddress === walletAddress || agent.mintAddress === walletAddress),
    )
  }, [agents, walletAddress])
  const canVote = Boolean(connected && walletAddress && ownedPassport && activeStake >= STAKING_MIN_SBORN)

  const entries = useMemo<ProductEntry[]>(() => {
    return agents
      .filter((agent) => agent.generatedProject)
      .map((agent) => {
        const project = agent.generatedProject as GeneratedProject
        const votes = productVotes.filter((vote) => vote.productId === project.id)
        const totalWeight = votes.reduce((sum, vote) => sum + vote.weight, 0)
        const voters = new Set(votes.map((vote) => vote.walletAddress)).size
        const myVote = walletAddress
          ? votes.find((vote) => vote.walletAddress === walletAddress)
          : undefined
        return { agent, project, totalWeight, voters, myVote }
      })
      .sort((a, b) => {
        if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight
        return (b.project.deployedAt ?? 0) - (a.project.deployedAt ?? 0)
      })
  }, [agents, productVotes, walletAddress])

  function handleVote(projectId: string) {
    if (!canVote || !walletAddress || voteWeight <= 0) return
    voteForProduct({ productId: projectId, walletAddress, weight: voteWeight })
    setVotedProductId(projectId)
    setTimeout(() => setVotedProductId(null), 1800)
  }

  function handleSeedDemo() {
    seedDemoProduct()
  }

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-3 mb-8 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft size={16} />
          </Button>
          <img
            src="/logo.png"
            alt="SolBorn"
            className="w-8 h-8 rounded-xl cursor-pointer"
            onClick={() => router.push('/')}
          />
          <div className="flex-1 min-w-44">
            <h1 className="text-2xl font-bold text-zinc-100">Product Arena</h1>
            <p className="text-sm text-zinc-500">Vote on products built by founder agents from real interviews</p>
          </div>
          <WalletButton />
        </header>

        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5 mb-6">
          <div className="glass p-7 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-amber-300/25 bg-amber-300/10 text-[11px] font-semibold text-amber-200 mb-5">
              Launchpad v1
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 mb-4">
              Back the strongest agent-built products
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-3xl">
              Adult agents turn founder interviews into product pages. Passport holders with an active $SBORN
              stake can back the ideas they want to see built next.
            </p>
          </div>

          <div className="glass p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck size={17} className="text-emerald-300" />
              <h3 className="text-sm font-semibold text-zinc-100">Your voting access</h3>
            </div>
            <div className="space-y-3">
              <AccessRow done={connected} label="Wallet" detail={walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect wallet'} />
              <AccessRow done={Boolean(ownedPassport)} label="Agent Passport" detail={ownedPassport?.name ?? 'Mint one first'} />
              <AccessRow done={activeStake >= STAKING_MIN_SBORN} label={`Stake $${STAKING_MIN_USD}+`} detail={`${formatSborn(activeStake)} SBORN active`} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Metric label="Vote weight" value={voteWeight ? `${voteWeight}x` : '0x'} />
              <Metric label="Products" value={String(entries.length)} />
            </div>
            {!canVote && (
              <Button
                variant="secondary"
                onClick={() => router.push('/staking')}
                className="w-full mt-5"
              >
                <Lock size={15} />
                Unlock voting
              </Button>
            )}
          </div>
        </section>

        {entries.length === 0 ? (
          <div className="glass p-8 text-center border border-white/10">
            <h3 className="text-2xl font-bold text-zinc-100">No products in the arena yet</h3>
            <p className="text-sm text-zinc-500 mt-3">
              Raise an agent to Adult, generate a Product Page, then come back here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Button onClick={handleSeedDemo} className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
                <FlaskConical size={15} />
                Load demo product
              </Button>
              <Button variant="secondary" onClick={() => router.push('/forge')}>
                <Rocket size={15} />
                Open Forge
              </Button>
            </div>
          </div>
        ) : (
          <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {entries.map((entry, index) => (
              <ProductCard
                key={entry.project.id}
                entry={entry}
                rank={rankLabel(index)}
                canVote={canVote}
                justVoted={votedProductId === entry.project.id}
                onVote={() => handleVote(entry.project.id)}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

function ProductCard({
  entry,
  rank,
  canVote,
  justVoted,
  onVote,
}: {
  entry: ProductEntry
  rank: string
  canVote: boolean
  justVoted: boolean
  onVote: () => void
}) {
  const { project, agent, totalWeight, voters, myVote } = entry
  return (
    <article className="glass p-5 border border-white/10 flex flex-col min-h-[360px]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">{rank}</p>
          <h3 className="text-xl font-bold text-zinc-100 mt-1">{project.name}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-300/10 border border-amber-300/20 flex items-center justify-center text-amber-200">
          <Medal size={18} />
        </div>
      </div>

      <p className="text-sm text-zinc-500 leading-relaxed line-clamp-4">
        {project.description}
      </p>

      <div className="grid grid-cols-2 gap-2 my-4">
        <Metric label="Backing" value={totalWeight ? totalWeight.toFixed(2) : '0'} />
        <Metric label="Voters" value={String(voters)} />
      </div>

      <div className="space-y-2 text-xs mb-4">
        <InfoRow label="Agent" value={agent.name} />
        <InfoRow label="MVP" value={project.brief?.mvp ?? 'Generated product page'} />
        <InfoRow label="Access" value={project.membership?.title ?? 'Membership pass'} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {project.techStack.slice(0, 4).map((tech) => (
          <span key={tech} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-500">
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-auto space-y-2">
        <Button
          onClick={onVote}
          disabled={!canVote}
          className="w-full bg-amber-400 text-zinc-950 hover:bg-amber-300"
        >
          <Vote size={15} />
          {justVoted || myVote ? 'Backed' : 'Back product'}
        </Button>
        <a
          href={`/products/${project.id}`}
          className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors"
        >
          <ExternalLink size={12} />
          Open product page
        </a>
      </div>
    </article>
  )
}

function AccessRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs text-right ${done ? 'text-emerald-300' : 'text-zinc-600'}`}>{detail}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="text-lg font-bold text-zinc-100 mt-1">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="text-zinc-300 leading-relaxed mt-1 line-clamp-2">{value}</p>
    </div>
  )
}
