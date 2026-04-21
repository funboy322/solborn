'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  Code2,
  ExternalLink,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useForgeStore } from '@/lib/store'
import { recordEvolution } from '@/lib/solana/payment'
import { STAGE_CONFIG } from '@/lib/constants'
import { SFX } from '@/lib/sounds'
import { useWallet } from '@solana/wallet-adapter-react'
import type { ForgeAgent, GeneratedProject } from '@/lib/types'

interface ProjectGeneratorProps {
  agent: ForgeAgent
}

type Phase = 'idle' | 'generating' | 'generated' | 'deploying' | 'deployed'

const LOADING_MESSAGES = [
  'Brainstorming ideas...',
  'Analyzing Solana ecosystem...',
  'Designing architecture...',
  'Writing Anchor program...',
  'Packaging Blink payload...',
]

function buildBlinkUrl(agent: ForgeAgent, project: GeneratedProject, origin: string): string {
  const blink = project.blink
  if (!blink) return ''
  // Recipient = agent creator wallet (falls back to platform treasury if unbound).
  const to = agent.walletAddress ?? 'F7QRP4aack2aYgRJa1Khxb7MmMtA1wEHRtP7Wex98BoL'
  const params = new URLSearchParams({
    to,
    name: agent.name,
    title: blink.title,
    desc: blink.description,
    cta: blink.cta,
    amounts: blink.amounts.join(','),
    pid: project.id,
  })
  return `${origin}/api/blinks/${agent.id}?${params.toString()}`
}

function dialToUrl(blinkUrl: string): string {
  return `https://dial.to/?action=solana-action:${encodeURIComponent(blinkUrl)}`
}

export function ProjectGenerator({ agent }: ProjectGeneratorProps) {
  const setGeneratedProject = useForgeStore((s) => s.setGeneratedProject)
  const addChainCheckpoint = useForgeStore((s) => s.addChainCheckpoint)
  const [phase, setPhase] = useState<Phase>(
    agent.generatedProject?.blinkUrl
      ? 'deployed'
      : agent.generatedProject
      ? 'generated'
      : 'idle',
  )
  const [project, setProject] = useState<GeneratedProject | null>(agent.generatedProject ?? null)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [copied, setCopied] = useState<'code' | 'url' | null>(null)
  const [codeOpen, setCodeOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { publicKey, signTransaction, connected } = useWallet()
  const config = STAGE_CONFIG[agent.stage]

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const blinkUrl = useMemo(
    () => (project && origin ? buildBlinkUrl(agent, project, origin) : ''),
    [agent, project, origin],
  )

  async function handleGenerate() {
    setPhase('generating')
    setError(null)

    let msgIdx = 0
    const interval = setInterval(() => {
      setLoadingMsg(LOADING_MESSAGES[msgIdx % LOADING_MESSAGES.length])
      msgIdx++
    }, 1500)

    try {
      const res = await fetch('/api/agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent }),
      })
      clearInterval(interval)
      if (!res.ok) throw new Error(`Generation failed (${res.status})`)
      const data = (await res.json()) as { project: GeneratedProject }
      setProject(data.project)
      setGeneratedProject(agent.id, data.project)
      setPhase('generated')
    } catch (e) {
      clearInterval(interval)
      setError(e instanceof Error ? e.message : 'Generation failed')
      setPhase('idle')
    }
  }

  async function handleDeploy() {
    if (!project || !blinkUrl) return
    setPhase('deploying')
    setError(null)

    let txSignature = ''
    // If wallet connected, write a real devnet memo recording the Blink deploy.
    if (connected && publicKey && signTransaction) {
      try {
        const r = await recordEvolution(publicKey, signTransaction, {
          agentName: agent.name,
          fromStage: agent.stage,
          toStage: agent.stage, // reuse the memo tx helper for now
          xp: agent.xp,
        })
        txSignature = r.txSignature
        addChainCheckpoint(agent.id, {
          kind: 'mint',
          stage: agent.stage,
          txSignature,
          timestamp: Date.now(),
        })
      } catch (e) {
        console.warn('[blink deploy] on-chain memo failed:', e)
        // non-fatal — Blink still works
      }
    }

    const updated: GeneratedProject = {
      ...project,
      deployedAt: Date.now(),
      txHash: txSignature || project.txHash,
      blinkUrl,
    }
    setProject(updated)
    setGeneratedProject(agent.id, updated)
    SFX.deploy()
    setPhase('deployed')
  }

  function handleCopy(text: string, kind: 'code' | 'url') {
    navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  if (agent.stage !== 'adult') return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Rocket size={16} style={{ color: config.color }} />
        <h2 className="text-sm font-semibold" style={{ color: config.color }}>
          Ship a Blink
        </h2>
      </div>

      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-6 text-center space-y-4"
        >
          <div className="text-4xl">🚀</div>
          <div>
            <p className="text-sm text-zinc-200 font-medium">
              {agent.name} is ready to ship
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Generate a Solana project + a live Blink that accepts SOL tips on devnet.
            </p>
          </div>
          <Button onClick={handleGenerate} className="w-full" style={{ background: config.color }}>
            <Sparkles size={16} />
            Generate Project & Blink
          </Button>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </motion.div>
      )}

      {phase === 'generating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-6 text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={32} style={{ color: config.color }} />
          </motion.div>
          <div>
            <p className="text-sm text-zinc-200 font-medium">{agent.name} is shipping...</p>
            <motion.p
              key={loadingMsg}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-zinc-500 mt-1"
            >
              {loadingMsg}
            </motion.p>
          </div>
        </motion.div>
      )}

      {(phase === 'generated' || phase === 'deploying' || phase === 'deployed') && project && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Project card */}
          <div className="glass p-5 space-y-4" style={{ boxShadow: `0 0 30px ${config.color}15` }}>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">{project.name}</h3>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{project.description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400"
                >
                  {tech}
                </span>
              ))}
            </div>

            {project.codeSnippet && (
              <div className="relative">
                <button
                  onClick={() => setCodeOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Code2 size={12} className="text-zinc-500" />
                    <span className="text-xs text-zinc-500">View generated code</span>
                  </div>
                  <span className="text-[10px] text-zinc-600">{codeOpen ? '▲ hide' : '▼ show'}</span>
                </button>
                {codeOpen && (
                  <div className="mt-1">
                    <div className="flex items-center justify-end px-3 py-1 bg-white/5 rounded-t-lg border border-white/10 border-b-0">
                      <button
                        onClick={() => handleCopy(project.codeSnippet, 'code')}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
                      >
                        {copied === 'code' ? <Check size={12} /> : <Copy size={12} />}
                        <span className="text-[10px]">{copied === 'code' ? 'copied' : 'copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-black/40 rounded-b-lg border border-white/10 border-t-0 overflow-x-auto max-h-64">
                      <code className="text-xs text-zinc-300 leading-relaxed">
                        {project.codeSnippet}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Blink preview card */}
          {project.blink && (
            <div
              className="glass p-4 space-y-2"
              style={{ borderColor: `${config.color}30` }}
            >
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: config.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: config.color }}>
                  Blink preview
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-100">{project.blink.title}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{project.blink.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.blink.amounts.map((a) => (
                  <span
                    key={a}
                    className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono"
                  >
                    {a} SOL
                  </span>
                ))}
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-500">
                  Custom
                </span>
              </div>
            </div>
          )}

          {phase === 'generated' && (
            <Button
              onClick={handleDeploy}
              className="w-full"
              style={{ background: config.color }}
            >
              <Rocket size={16} />
              Ship Blink to Devnet
            </Button>
          )}

          {phase === 'deploying' && (
            <Button disabled className="w-full" loading>
              Deploying Blink...
            </Button>
          )}

          {phase === 'deployed' && project.blinkUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-4 space-y-3"
              style={{ boxShadow: `0 0 20px ${config.color}20` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-400">
                  Blink live on devnet
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Anyone with a Solana wallet can now tip {agent.name} in one click.
                The Blink renders inside Phantom, X posts, and dial.to.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Blink URL
                </label>
                <div className="flex items-center gap-2 rounded-lg bg-black/40 border border-white/10 px-3 py-2">
                  <code className="flex-1 text-[11px] font-mono text-zinc-300 truncate">
                    {project.blinkUrl}
                  </code>
                  <button
                    onClick={() => handleCopy(project.blinkUrl!, 'url')}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {copied === 'url' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={dialToUrl(project.blinkUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: config.color, color: '#0a0a0a' }}
                >
                  <ExternalLink size={12} />
                  Open in dial.to
                </a>
                {project.txHash && (
                  <a
                    href={`https://explorer.solana.com/tx/${project.txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <ExternalLink size={12} />
                    Deploy tx on Explorer
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
