'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, ArrowLeft, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet/WalletButton'
import { AgentCard } from '@/components/agent/AgentCard'
import { CreateAgentModal } from '@/components/forge/CreateAgentModal'
import { useForgeStore } from '@/lib/store'
import { useWallet } from '@solana/wallet-adapter-react'

export default function ForgePage() {
  const router = useRouter()
  const allAgents = useForgeStore((s) => s.agents)
  const { publicKey, connected } = useWallet()
  const [modalOpen, setModalOpen] = useState(false)

  // Show only agents owned by current wallet (or unowned if disconnected)
  const walletAddr = publicKey?.toBase58() ?? null
  const agents = walletAddr
    ? allAgents.filter((a) => a.walletAddress === walletAddr || !a.walletAddress)
    : allAgents.filter((a) => !a.walletAddress)

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft size={16} />
            Home
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-zinc-100">The Forge</h1>
            <p className="text-sm text-zinc-500">
              {agents.length} agent{agents.length !== 1 ? 's' : ''}
              {connected && walletAddr && (
                <span className="ml-2 text-emerald-400 text-xs">
                  · {walletAddr.slice(0, 6)}...{walletAddr.slice(-4)}
                </span>
              )}
            </p>
          </div>
          <WalletButton />
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            New Agent
          </Button>
        </div>

        {/* Wallet prompt if not connected */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl flex items-center gap-4"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}>
              <Wallet size={18} className="text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">Connect wallet to see your agents</p>
              <p className="text-xs text-zinc-500 mt-0.5">Agents are bound to your wallet. Connect to access them.</p>
            </div>
            <WalletButton />
          </motion.div>
        )}

        {/* Empty state */}
        {agents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="text-6xl mb-4">🔨</div>
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">No agents yet</h2>
            <p className="text-zinc-600 mb-6">
              {connected
                ? 'Forge your first AI founder to get started'
                : 'Connect wallet and forge your first AI founder'}
            </p>
            <Button onClick={() => setModalOpen(true)}>
              {connected ? 'Forge First Agent' : 'Connect & Forge'}
            </Button>
          </motion.div>
        )}

        {/* Agent grid */}
        <div className="space-y-3">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AgentCard
                agent={agent}
                onClick={() => router.push(`/forge/${agent.id}`)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <CreateAgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => router.push(`/forge/${id}`)}
      />
    </main>
  )
}
