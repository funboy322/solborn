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
import { ArrowLeft, ExternalLink, Rocket, ShieldCheck, Share2, Sparkles } from 'lucide-react'
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
  const ticker = mirror.project.memecoinBrief?.ticker
  const titleWithTicker = ticker ? `$${ticker.toUpperCase()} · ${name}` : `${name} · SolBorn`
  const ogImage = `https://solborn.xyz/api/og/product/${subdomain}?v=${mirror.syncedAt}`
  return {
    title: titleWithTicker,
    description: desc,
    openGraph: {
      title: titleWithTicker,
      description: desc,
      url: `https://${subdomain}.solborn.xyz/`,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${name} — launched with SolBorn`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleWithTicker,
      description: desc,
      images: [ogImage],
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
  const ticker = project.memecoinBrief?.ticker?.toUpperCase()

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

        <div className="space-y-6">
          {/* Hero — giant emoji + big ticker */}
          <section
            className="relative overflow-hidden rounded-3xl p-8 sm:p-14 border border-white/10"
            style={{
              background: `radial-gradient(ellipse 900px 500px at 100% 0%, ${accentColor}22 0%, transparent 60%), radial-gradient(ellipse 700px 400px at 0% 100%, ${accentColor}12 0%, transparent 60%), rgba(15,15,20,0.55)`,
            }}
          >
            {/* Watermark ticker letters — background flair */}
            {ticker && (
              <div
                className="pointer-events-none absolute -top-8 -right-6 sm:-right-10 select-none opacity-[0.045]"
                aria-hidden
                style={{
                  fontSize: 'clamp(10rem, 22vw, 22rem)',
                  fontWeight: 900,
                  color: accentColor,
                  lineHeight: 0.85,
                  letterSpacing: '-0.06em',
                }}
              >
                ${ticker}
              </div>
            )}

            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}66, transparent)`,
              }}
            />

            <div className="relative grid gap-8 sm:gap-10 sm:grid-cols-[auto_1fr] items-center">
              {/* Giant emoji tile */}
              <div
                className="w-32 h-32 sm:w-44 sm:h-44 rounded-3xl flex items-center justify-center text-[5rem] sm:text-[7rem] select-none mx-auto sm:mx-0"
                style={{
                  background: `${accentColor}12`,
                  border: `1.5px solid ${accentColor}44`,
                  boxShadow: `0 20px 50px ${accentColor}22`,
                }}
              >
                {agent.emoji}
              </div>

              {/* Right column — pill / ticker / name / tagline / desc / actions */}
              <div className="min-w-0">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-5 border text-[11px] font-semibold"
                  style={{
                    background: `${accentColor}14`,
                    borderColor: `${accentColor}38`,
                    color: accentColor,
                  }}
                >
                  <Sparkles size={11} />
                  AI-built launch
                </div>

                {ticker && (
                  <h1
                    className="font-black leading-[0.9] tracking-[-0.04em] break-words mb-3"
                    style={{
                      color: accentColor,
                      fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
                    }}
                  >
                    ${ticker}
                  </h1>
                )}
                <p className="text-xl sm:text-2xl font-semibold text-zinc-100 mb-3 leading-tight">
                  {project.name}
                </p>
                {project.tagline && (
                  <p className="text-base sm:text-lg text-zinc-300 leading-snug max-w-2xl mb-4">
                    {project.tagline}
                  </p>
                )}
                <p className="text-[13px] sm:text-sm text-zinc-500 leading-relaxed max-w-2xl">
                  {project.description}
                </p>

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
                  <ShareOnXButton
                    subdomain={subdomain}
                    projectName={project.name}
                    ticker={project.memecoinBrief?.ticker}
                    tagline={project.tagline ?? null}
                    accentColor={accentColor}
                  />
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
                  <div className="flex flex-wrap gap-2 mt-5">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="text-[11px] text-zinc-500 px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.02]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* AI Landing */}
          {project.landingContent && (
            <RenderedLanding landing={project.landingContent} accentColor={accentColor} />
          )}

          {/* Launch thread — styled like an actual X thread */}
          {project.launchThread && project.launchThread.tweets.length > 0 && (
            <section
              className="rounded-3xl p-8 sm:p-10 border border-white/10 space-y-6"
              style={{ background: 'rgba(15,15,20,0.55)' }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2
                  className="text-[11px] font-mono uppercase tracking-[0.25em]"
                  style={{ color: accentColor }}
                >
                  Launch thread
                </h2>
                {project.launchThread.hashtags?.length > 0 && (
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {project.launchThread.hashtags.map((h) => `#${h}`).join(' ')}
                  </span>
                )}
              </div>

              <div className="relative">
                {/* Vertical connector line running through the tweet avatars */}
                <div
                  className="pointer-events-none absolute top-6 bottom-6 w-px"
                  style={{
                    left: 'calc(1.25rem + 0.5px)',
                    background: `linear-gradient(180deg, ${accentColor}55, ${accentColor}15)`,
                  }}
                  aria-hidden
                />

                <ol className="space-y-3">
                  {project.launchThread.tweets.map((tweet, idx) => (
                    <li key={idx} className="relative flex gap-3">
                      {/* Avatar with agent emoji */}
                      <div
                        className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 select-none"
                        style={{
                          background: `${accentColor}18`,
                          border: `1.5px solid ${accentColor}55`,
                        }}
                      >
                        {agent.emoji}
                      </div>

                      <div className="flex-1 min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-bold text-zinc-100 truncate">
                            {project.name}
                          </span>
                          <span className="text-xs text-zinc-500 truncate">
                            @{subdomain}
                          </span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-xs text-zinc-500 font-mono tabular-nums">
                            {idx + 1}/{project.launchThread!.tweets.length}
                          </span>
                          <div className="flex-1" />
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors inline-flex items-center gap-1 flex-shrink-0"
                            title="Post this tweet on X"
                          >
                            post
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-[15px] text-zinc-100 leading-[1.55] whitespace-pre-wrap">
                          {tweet}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Post tweet 1 on X first, then reply with the rest in order. This is a preview of what the thread will look like once posted.
              </p>
            </section>
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
              Built with solborn.xyz · the AI memecoin launchpad on Solana
            </Link>
          </footer>
        </div>
      </div>
    </main>
  )
}

function ShareOnXButton({
  subdomain,
  projectName,
  ticker,
  tagline,
  accentColor,
}: {
  subdomain: string
  projectName: string
  ticker?: string
  tagline: string | null
  accentColor: string
}) {
  const url = `https://${subdomain}.solborn.xyz/`
  const tickerTag = ticker ? `$${ticker.toUpperCase()}` : projectName
  // Voice consistency with the site: lowercase, no em-dash, no three-of-a-kind.
  // Twitter's intent URL preserves newlines when we encode \n.
  const openingLine = tagline ? `${tickerTag}. ${tagline}` : `${tickerTag} is live.`
  const lines: string[] = [
    openingLine,
    '',
    url,
    '',
    'launched with @solborn_xyz',
  ]
  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(lines.join('\n'))}`

  return (
    <a
      href={intentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-zinc-100 transition-transform hover:scale-[1.02]"
      style={{
        background: `${accentColor}22`,
        border: `1px solid ${accentColor}55`,
      }}
      title="Share this launch on X"
    >
      <Share2 size={14} style={{ color: accentColor }} />
      Share on X
    </a>
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
