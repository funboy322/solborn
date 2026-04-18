'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, Code2, ExternalLink, Loader2, Sparkles, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useForgeStore } from '@/lib/store'
import { deployMockProgram } from '@/lib/solana/mock-nft'
import { STAGE_CONFIG } from '@/lib/constants'
import { SFX } from '@/lib/sounds'
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
  'Optimizing for devnet...',
]

export function ProjectGenerator({ agent }: ProjectGeneratorProps) {
  const setGeneratedProject = useForgeStore((s) => s.setGeneratedProject)
  const [phase, setPhase] = useState<Phase>(agent.generatedProject ? 'generated' : 'idle')
  const [project, setProject] = useState<GeneratedProject | null>(agent.generatedProject ?? null)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [deployResult, setDeployResult] = useState<{
    programId: string
    txSignature: string
    explorerUrl: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const config = STAGE_CONFIG[agent.stage]

  async function handleGenerate() {
    setPhase('generating')

    // Cycle through loading messages
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

      if (!res.ok) throw new Error('Generation failed')

      const data = await res.json()
      setProject(data.project)
      setGeneratedProject(agent.id, data.project)
      setPhase('generated')
    } catch {
      clearInterval(interval)
      setPhase('idle')
    }
  }

  async function handleDeploy() {
    if (!project) return
    setPhase('deploying')

    const result = await deployMockProgram(project.name)
    setDeployResult(result)
    SFX.deploy()

    // Update project with deploy info
    const updated: GeneratedProject = {
      ...project,
      solanaProgram: result.programId,
      deployedAt: Date.now(),
      txHash: result.txSignature,
    }
    setProject(updated)
    setGeneratedProject(agent.id, updated)
    setPhase('deployed')
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (agent.stage !== 'adult') return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Rocket size={16} style={{ color: config.color }} />
        <h2 className="text-sm font-semibold" style={{ color: config.color }}>
          Project Generation
        </h2>
      </div>

      {/* Idle — ready to generate */}
      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-6 text-center space-y-4"
        >
          <div className="text-4xl">🚀</div>
          <div>
            <p className="text-sm text-zinc-200 font-medium">
              {agent.name} is ready to build
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Your agent will generate a complete Solana project idea with code
            </p>
          </div>
          <Button onClick={handleGenerate} className="w-full" style={{ background: config.color }}>
            <Sparkles size={16} />
            Generate First Project
          </Button>
        </motion.div>
      )}

      {/* Generating */}
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
            <p className="text-sm text-zinc-200 font-medium">{agent.name} is creating...</p>
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

      {/* Generated / Deployed — show project */}
      {(phase === 'generated' || phase === 'deploying' || phase === 'deployed') && project && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Project card */}
          <div className="glass p-5 space-y-4" style={{ boxShadow: `0 0 30px ${config.color}15` }}>
            {/* Name + description */}
            <div>
              <h3 className="text-lg font-bold text-zinc-100">{project.name}</h3>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{project.description}</p>
            </div>

            {/* Tech stack */}
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

            {/* Code snippet */}
            {project.codeSnippet && (
              <div className="relative">
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-t-lg border border-white/10 border-b-0">
                  <div className="flex items-center gap-1.5">
                    <Code2 size={12} className="text-zinc-500" />
                    <span className="text-xs text-zinc-500">program.rs</span>
                  </div>
                  <button
                    onClick={() => handleCopy(project.codeSnippet)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <pre className="p-3 bg-black/40 rounded-b-lg border border-white/10 border-t-0 overflow-x-auto">
                  <code className="text-xs text-zinc-300 leading-relaxed">
                    {project.codeSnippet}
                  </code>
                </pre>
              </div>
            )}
          </div>

          {/* Deploy section */}
          {phase === 'generated' && (
            <Button
              onClick={handleDeploy}
              className="w-full"
              style={{ background: config.color }}
            >
              <Rocket size={16} />
              Deploy to Solana Devnet
            </Button>
          )}

          {phase === 'deploying' && (
            <Button disabled className="w-full" loading>
              Deploying to Devnet...
            </Button>
          )}

          {phase === 'deployed' && deployResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-4 space-y-3"
              style={{ boxShadow: `0 0 20px ${config.color}20` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-400">
                  Deployed Successfully!
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-zinc-500">Program ID</span>
                  <p className="font-mono text-zinc-300 break-all mt-0.5">
                    {deployResult.programId}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Transaction</span>
                  <p className="font-mono text-zinc-300 break-all mt-0.5">
                    {deployResult.txSignature.slice(0, 40)}...
                  </p>
                </div>
              </div>

              <a
                href={deployResult.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: config.color }}
              >
                <ExternalLink size={12} />
                View on Solana Explorer
              </a>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
