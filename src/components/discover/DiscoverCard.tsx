'use client'

/**
 * Single product card in the /discover grid.
 *
 * Whole card is a link to the subdomain page (opens in a new tab so the
 * /discover stays mounted while the visitor evaluates the product). The
 * "Visit" arrow on the right is decorative — clicking anywhere on the
 * card navigates.
 */

import { motion } from 'framer-motion'
import { ExternalLink, Globe, Sparkles } from 'lucide-react'
import { STAGE_CONFIG } from '@/lib/constants'
import type { DiscoverCard as DiscoverCardData } from '@/lib/discover'

interface DiscoverCardProps {
  card: DiscoverCardData
  index?: number
}

const STAGE_BADGE_LABEL: Record<DiscoverCardData['agentStage'], string> = {
  baby: 'baby',
  toddler: 'toddler',
  teen: 'teen',
  adult: 'adult',
}

export function DiscoverCard({ card, index = 0 }: DiscoverCardProps) {
  const stage = STAGE_CONFIG[card.agentStage]
  const accentColor = stage?.color ?? '#8b5cf6'
  const href = `https://${card.subdomain}.solborn.xyz/`

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="group relative flex flex-col gap-3 rounded-2xl p-5 border transition-shadow"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: 'transparent',
      }}
    >
      {/* Accent line on top, only visible on hover */}
      <span
        className="absolute inset-x-5 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)`,
        }}
      />

      {/* Agent row */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${accentColor}1c` }}
        >
          {card.agentEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-zinc-400 truncate font-medium">
            {card.agentName}
          </div>
          <div
            className="text-[10px] uppercase tracking-wider"
            style={{ color: accentColor }}
          >
            {STAGE_BADGE_LABEL[card.agentStage]}
          </div>
        </div>
        {card.hasLanding && (
          <span
            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap"
            style={{
              background: `${accentColor}14`,
              borderColor: `${accentColor}38`,
              color: accentColor,
            }}
            title="AI landing page generated"
          >
            <Sparkles size={9} />
            ai
          </span>
        )}
      </div>

      {/* Project name + tagline */}
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-zinc-100 leading-tight line-clamp-2">
          {card.projectName}
        </h3>
        {card.tagline && (
          <p className="text-sm text-zinc-300 leading-snug line-clamp-2">
            {card.tagline}
          </p>
        )}
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 flex-1">
        {card.description}
      </p>

      {/* Tech tags */}
      {card.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.techStack.map((tech) => (
            <span
              key={tech}
              className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.02] truncate max-w-[140px]"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Footer with subdomain URL */}
      <div className="mt-1 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 truncate min-w-0">
          <Globe size={12} className="flex-shrink-0" />
          <span className="truncate">{card.subdomain}.solborn.xyz</span>
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs font-medium opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{ color: accentColor }}
        >
          Visit
          <ExternalLink size={12} />
        </span>
      </div>
    </motion.a>
  )
}
