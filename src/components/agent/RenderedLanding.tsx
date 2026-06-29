'use client'

/**
 * Renders an AI-generated LandingContent block on the public product page.
 *
 * Drops in above the existing brief/details sections. Sections are laid
 * out in classic landing-page order:
 *   1. Hero   — gradient bg, big headline + subhead + CTA
 *   2. Features — 2x2 grid
 *   3. How it works — 4 numbered steps
 *   4. FAQ — 4 stacked Q+A items
 *   5. CTA — closing call
 *
 * Visual language matches the rest of the product page (rgba glass bg,
 * blur, accent-tinted borders). Icons resolve dynamically from the
 * lucide-react PascalCase string the LLM emitted; falls back to Sparkles.
 */

import { createElement, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import { ArrowRight, Check, ChevronDown, Sparkles } from 'lucide-react'
import type {
  LandingContent,
  LandingFeature,
  LandingStep,
  LandingFaqItem,
  TokenomicsRow,
} from '@/lib/types'

interface RenderedLandingProps {
  landing: LandingContent
  accentColor: string
}

export function RenderedLanding({ landing, accentColor }: RenderedLandingProps) {
  // New memecoin layout uses lore + tokenomics + howToBuy.
  // Legacy projects (pre-pivot) used features + howItWorks. We render whichever
  // is present so older subdomains keep working without regeneration.
  const hasMemecoinLayout = Boolean(
    (landing.lore && landing.lore.length > 0) ||
      (landing.tokenomics && landing.tokenomics.length > 0) ||
      (landing.howToBuy && landing.howToBuy.length > 0)
  )

  return (
    <section className="space-y-5" data-testid="rendered-landing">
      <HeroSection hero={landing.hero} accentColor={accentColor} />

      {hasMemecoinLayout ? (
        <>
          {landing.lore && landing.lore.length > 0 && (
            <LoreSection lore={landing.lore} accentColor={accentColor} />
          )}
          {landing.tokenomics && landing.tokenomics.length > 0 && (
            <TokenomicsSection rows={landing.tokenomics} accentColor={accentColor} />
          )}
          {landing.howToBuy && landing.howToBuy.length > 0 && (
            <HowToBuySection steps={landing.howToBuy} accentColor={accentColor} />
          )}
        </>
      ) : (
        <>
          {landing.features && landing.features.length > 0 && (
            <FeaturesSection features={landing.features} accentColor={accentColor} />
          )}
          {landing.howItWorks && landing.howItWorks.length > 0 && (
            <HowItWorksSection steps={landing.howItWorks} accentColor={accentColor} />
          )}
        </>
      )}

      <FaqSection faq={landing.faq} accentColor={accentColor} />
      <CtaSection cta={landing.cta} accentColor={accentColor} />

      {landing.riskDisclosure && (
        <p className="text-center text-[11px] text-zinc-600 leading-relaxed max-w-md mx-auto pt-2">
          {landing.riskDisclosure}
        </p>
      )}
    </section>
  )
}

// ─── Lore (new) ──────────────────────────────────────────────────────────────

function LoreSection({
  lore,
  accentColor,
}: {
  lore: string[]
  accentColor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl p-7 sm:p-9 border border-white/10"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <h3
        className="text-xs uppercase tracking-wider mb-5"
        style={{ color: accentColor }}
      >
        Lore
      </h3>
      <div className="space-y-4 max-w-3xl">
        {lore.map((para, i) => (
          <p key={i} className="text-base text-zinc-200 leading-relaxed">
            {para}
          </p>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Tokenomics (new) ────────────────────────────────────────────────────────

function TokenomicsSection({
  rows,
  accentColor,
}: {
  rows: TokenomicsRow[]
  accentColor: string
}) {
  return (
    <div
      className="glass rounded-2xl p-6 border border-white/10"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-4">Tokenomics</h3>
      <dl className="grid sm:grid-cols-2 gap-3">
        {rows.map((row, i) => (
          <div
            key={i}
            className="rounded-xl px-3.5 py-2.5 border"
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <dt className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
              {row.label}
            </dt>
            <dd className="text-sm font-semibold" style={{ color: accentColor }}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ─── How to buy (new) ────────────────────────────────────────────────────────

function HowToBuySection({
  steps,
  accentColor,
}: {
  steps: LandingStep[]
  accentColor: string
}) {
  return (
    <div
      className="glass rounded-2xl p-6 border border-white/10"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-5">How to buy</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 * i }}
          >
            <div
              className="text-3xl font-bold mb-2 tabular-nums"
              style={{ color: accentColor }}
            >
              {String(step.stepNumber).padStart(2, '0')}
            </div>
            <h4 className="text-sm font-semibold text-zinc-100 mb-1">{step.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function HeroSection({
  hero,
  accentColor,
}: {
  hero: LandingContent['hero']
  accentColor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass relative overflow-hidden rounded-2xl p-8 sm:p-12 border border-white/10"
      style={{
        background: `radial-gradient(ellipse at top, ${accentColor}18 0%, rgba(15,15,20,0) 60%), rgba(15,15,20,0.45)`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}66, transparent)`,
        }}
      />
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-5 border text-[10px] uppercase tracking-wider"
        style={{
          background: `${accentColor}14`,
          borderColor: `${accentColor}38`,
          color: accentColor,
        }}
      >
        <Sparkles size={11} />
        ai-generated landing
      </div>
      <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50 leading-[1.05] max-w-3xl">
        {hero.headline}
      </h2>
      <p className="mt-4 text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
        {hero.subhead}
      </p>
      <div className="mt-7">
        <CtaButton text={hero.ctaText} href={hero.ctaHref} accentColor={accentColor} />
      </div>
    </motion.div>
  )
}

// ─── Features ───────────────────────────────────────────────────────────────

function FeaturesSection({
  features,
  accentColor,
}: {
  features: LandingFeature[]
  accentColor: string
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {features.map((f, i) => (
        <FeatureCard key={i} feature={f} index={i} accentColor={accentColor} />
      ))}
    </div>
  )
}

function FeatureCard({
  feature,
  index,
  accentColor,
}: {
  feature: LandingFeature
  index: number
  accentColor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.04 * index }}
      className="glass p-5 rounded-2xl border border-white/10"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: `${accentColor}1f`,
          color: accentColor,
        }}
      >
        {renderIcon(feature.icon, 18)}
      </div>
      <h3 className="text-base font-semibold text-zinc-100 mb-1.5">{feature.title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{feature.body}</p>
    </motion.div>
  )
}

// ─── How it works ───────────────────────────────────────────────────────────

function HowItWorksSection({
  steps,
  accentColor,
}: {
  steps: LandingStep[]
  accentColor: string
}) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-5">How it works</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 * i }}
            className="relative"
          >
            <div
              className="text-3xl font-bold mb-2 tabular-nums"
              style={{ color: `${accentColor}` }}
            >
              {String(step.stepNumber).padStart(2, '0')}
            </div>
            <h4 className="text-sm font-semibold text-zinc-100 mb-1">{step.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── FAQ ────────────────────────────────────────────────────────────────────

function FaqSection({
  faq,
  accentColor,
}: {
  faq: LandingFaqItem[]
  accentColor: string
}) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-4">FAQ</h3>
      <div className="space-y-2">
        {faq.map((item, i) => (
          <FaqItem key={i} item={item} accentColor={accentColor} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  )
}

function FaqItem({
  item,
  accentColor,
  defaultOpen,
}: {
  item: LandingFaqItem
  accentColor: string
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left px-4 py-3 hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm text-zinc-100 font-medium">{item.question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ color: open ? accentColor : 'rgb(113,113,122)' }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="px-4 pb-4 text-sm text-zinc-400 leading-relaxed"
        >
          {item.answer}
        </motion.div>
      )}
    </div>
  )
}

// ─── CTA ────────────────────────────────────────────────────────────────────

function CtaSection({
  cta,
  accentColor,
}: {
  cta: LandingContent['cta']
  accentColor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass relative overflow-hidden rounded-2xl p-8 border border-white/10 text-center"
      style={{
        background: `linear-gradient(135deg, ${accentColor}14 0%, rgba(15,15,20,0.4) 100%)`,
      }}
    >
      <h3 className="text-2xl sm:text-3xl font-bold text-zinc-50 leading-tight">{cta.headline}</h3>
      {cta.subhead && (
        <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-xl mx-auto leading-relaxed">
          {cta.subhead}
        </p>
      )}
      <div className="mt-5 flex justify-center">
        <CtaButton text={cta.buttonText} href={cta.href} accentColor={accentColor} />
      </div>
    </motion.div>
  )
}

// ─── Shared ─────────────────────────────────────────────────────────────────

function CtaButton({
  text,
  href,
  accentColor,
}: {
  text: string
  href?: string
  accentColor: string
}) {
  const className =
    'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]'
  const style = {
    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {text}
        <ArrowRight size={15} />
      </a>
    )
  }
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => {
        document
          .getElementById('request-access')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
    >
      {text}
      <ArrowRight size={15} />
    </button>
  )
}

/**
 * Resolve a lucide-react icon by PascalCase name (as emitted by the LLM)
 * and return it as already-instantiated JSX. We render JSX rather than
 * passing a component reference around to keep the lint rule
 * "no-create-component-in-render" happy.
 */
function renderIcon(name: string | undefined, size: number): ReactNode {
  if (!name) return <Sparkles size={size} />
  const lookup = (LucideIcons as unknown as Record<string, unknown>)[name]
  if (lookup && (typeof lookup === 'function' || typeof lookup === 'object')) {
    return createElement(
      lookup as React.ComponentType<{ size?: number; className?: string }>,
      { size }
    )
  }
  return <Check size={size} />
}
