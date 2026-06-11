/**
 * Public tenant page — server-rendered from the Upstash mirror.
 *
 * Middleware rewrites <slug>.solborn.xyz → /p/<slug>, then this page reads
 * the mirror, renders the product page in read-only mode, and stops. No
 * Edit / Generate buttons, no demo controls, no zustand store access.
 *
 * Why server-rendered: visitors don't have the project in their browser's
 * local store. The server is the only place that holds enough data to
 * paint the page. Cache the render at the edge for 60s — frequent enough
 * that the owner's "Republish" feels close to real-time, light enough on
 * Redis quota that a viral post won't burn the free tier.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { RenderedLanding } from '@/components/agent/RenderedLanding'
import { getProductMirror, isRedisConfigured } from '@/lib/redis'
import { STAGE_CONFIG } from '@/lib/constants'

interface Props {
  params: Promise<{ subdomain: string }>
}

/**
 * Refresh window between Redis lookups, in seconds. Owner's "Republish"
 * propagates within this window worst-case.
 */
export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params
  if (!isRedisConfigured()) return { title: subdomain }
  const mirror = await getProductMirror(subdomain).catch(() => null)
  if (!mirror) return { title: `${subdomain} · SolBorn` }
  const name = mirror.project.name
  const desc = mirror.project.tagline ?? mirror.project.description
  return {
    title: `${name} · SolBorn`,
    description: desc,
    openGraph: {
      title: name,
      description: desc,
      url: `https://${subdomain}.solborn.xyz/`,
      type: 'website',
    },
    twitter: {
      title: name,
      description: desc,
    },
    alternates: { canonical: `https://${subdomain}.solborn.xyz/` },
  }
}

export default async function PublicSubdomainPage({ params }: Props) {
  const { subdomain } = await params

  if (!isRedisConfigured()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-zinc-100">Subdomains are not configured yet</h1>
          <p className="text-sm text-zinc-500 mt-3">
            The operator has not connected an Upstash Redis instance. Try again later, or visit{' '}
            <Link href="https://www.solborn.xyz/" className="text-violet-300 hover:underline">
              solborn.xyz
            </Link>
            .
          </p>
        </div>
      </main>
    )
  }

  const mirror = await getProductMirror(subdomain)
  if (!mirror) return notFound()

  const { agent, project } = mirror
  const stageConfig = STAGE_CONFIG[agent.stage]
  const accentColor = stageConfig?.color ?? '#8b5cf6'

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-3 mb-8 flex-wrap">
          <Link
            href="https://www.solborn.xyz/"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
            rel="noopener"
          >
            <ArrowLeft size={14} />
            solborn.xyz
          </Link>
          <div className="flex-1" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">
            published via solborn
          </span>
        </header>

        <div className="space-y-5">
          {/* Hero */}
          <section
            className="glass relative overflow-hidden rounded-2xl p-7 sm:p-9 border border-white/10"
            style={{
              background: `radial-gradient(ellipse at top left, ${accentColor}18 0%, rgba(15,15,20,0) 55%), rgba(15,15,20,0.45)`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}66, transparent)`,
              }}
            />
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-5 border text-[11px] font-semibold"
              style={{
                background: `${accentColor}14`,
                borderColor: `${accentColor}38`,
                color: accentColor,
              }}
            >
              <Sparkles size={11} />
              Agent-built product
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50 mb-3">
              {project.name}
            </h1>
            {project.tagline && (
              <p className="text-lg sm:text-xl text-zinc-200 leading-snug max-w-3xl mb-4">
                {project.tagline}
              </p>
            )}
            <p className="text-zinc-400 leading-relaxed max-w-3xl">{project.description}</p>

            <div className="flex flex-wrap gap-2 mt-6">
              {project.productUrl ? (
                <a
                  href={project.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  }}
                  title={
                    project.productUrlVerified
                      ? 'Verified by Google Safe Browsing'
                      : 'Link not verified — open at your own risk'
                  }
                >
                  Visit product
                  <ExternalLink size={14} />
                  {project.productUrlVerified && (
                    <ShieldCheck size={14} className="text-emerald-200" />
                  )}
                </a>
              ) : null}
              {project.txHash && (
                <a
                  href={`https://explorer.solana.com/tx/${project.txHash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06] transition-colors"
                >
                  <ExternalLink size={14} />
                  View launch proof
                </a>
              )}
            </div>

            {project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-[11px] text-zinc-400 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* AI Landing */}
          {project.landingContent && (
            <RenderedLanding landing={project.landingContent} accentColor={accentColor} />
          )}

          {/* Brief */}
          {project.brief && (
            <section className="glass rounded-2xl p-6 border border-white/10 space-y-5">
              <h2 className="text-xs uppercase tracking-wider text-zinc-500">Brief</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {project.brief.targetUser && (
                  <BriefBlock label="Target user" body={project.brief.targetUser} />
                )}
                {project.brief.problem && (
                  <BriefBlock label="Problem" body={project.brief.problem} />
                )}
                {project.brief.solution && (
                  <BriefBlock label="Solution" body={project.brief.solution} />
                )}
                {project.brief.mvp && <BriefBlock label="MVP" body={project.brief.mvp} />}
                {project.brief.solanaAngle && (
                  <BriefBlock label="Solana angle" body={project.brief.solanaAngle} />
                )}
                {project.brief.pricing && (
                  <BriefBlock label="Pricing" body={project.brief.pricing} />
                )}
              </div>
              {project.brief.launchPlan && project.brief.launchPlan.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
                    Launch plan
                  </h3>
                  <ol className="space-y-2 text-sm text-zinc-300">
                    {project.brief.launchPlan.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-zinc-500 tabular-nums">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          )}

          {/* Footer */}
          <footer className="text-center pt-2 pb-8">
            <Link
              href="https://www.solborn.xyz/"
              className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
              rel="noopener"
            >
              <Rocket size={12} />
              Built with solborn.xyz · the AI co-founder for Solana builders
            </Link>
          </footer>
        </div>
      </div>
    </main>
  )
}

function BriefBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">{label}</h3>
      <p className="text-sm text-zinc-300 leading-relaxed">{body}</p>
    </div>
  )
}
