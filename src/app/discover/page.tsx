/**
 * /discover — public marketplace of every claimed subdomain.
 *
 * Server-rendered + ISR (30s revalidate). The page reads straight from
 * the Redis helpers via getDiscoverPage so the SSR doesn't go through the
 * /api/discover/list HTTP round-trip. The API route still exists for
 * client-side pagination and external integrations.
 *
 * Pagination is implemented as plain ?cursor=<n> query params so each
 * page is its own URL — good for SEO, no JS required to read further.
 */

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Compass, Crown, Sparkles } from 'lucide-react'
import { DiscoverCard } from '@/components/discover/DiscoverCard'
import { DEFAULT_PAGE_SIZE, getDiscoverPage } from '@/lib/discover'

export const revalidate = 30

interface Props {
  searchParams: Promise<{ cursor?: string }>
}

export default async function DiscoverPage({ searchParams }: Props) {
  const { cursor: cursorRaw } = await searchParams
  const cursor = (() => {
    const parsed = cursorRaw ? parseInt(cursorRaw, 10) : 0
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  })()

  const page = await getDiscoverPage(cursor, DEFAULT_PAGE_SIZE)

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-3 mb-8 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={14} />
            home
          </Link>
          <Image
            src="/logo.png"
            alt="SolBorn"
            width={32}
            height={32}
            className="rounded-xl ml-1"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 leading-tight whitespace-nowrap">
              Discover
            </h1>
            <p className="text-xs text-zinc-500">
              {page.total === 0
                ? 'No projects yet'
                : page.total === 1
                  ? '1 project'
                  : `${page.total} projects`}
            </p>
          </div>
          <Link
            href="/forge"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-violet-100 bg-violet-500/20 border border-violet-400/30 hover:bg-violet-500/30 transition-colors"
          >
            <Sparkles size={12} />
            Forge
          </Link>
        </header>

        <section className="mb-7">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-50 leading-tight">
            Memecoins launched by AI agents on Solana
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl mt-2">
            Each card is a coin shipped through SolBorn — the agent wrote the lore, landing,
            and launch thread, then the creator claimed a subdomain. Click any to dive in.
          </p>
        </section>

        {page.unavailable ? (
          <EmptyState
            title="Discover is paused"
            body="The marketplace storage is not configured on this deploy. The rest of SolBorn still works — try /forge or your existing product page."
          />
        ) : page.items.length === 0 ? (
          <EmptyState
            title="No memecoins launched here yet"
            body="Be first. Talk to the agent in the Forge, ship your lore, landing and thread, then claim a subdomain."
            ctaHref="/forge"
            ctaLabel="Launch your memecoin"
          />
        ) : (
          <>
            {page.featured.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={14} className="text-amber-300" />
                  <h3 className="text-xs uppercase tracking-wider text-zinc-400">
                    Featured · $SBORN holders
                  </h3>
                  <Link
                    href="/staking"
                    className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors ml-auto"
                  >
                    how to get here ↗
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {page.featured.map((card, i) => (
                    <DiscoverCard key={card.subdomain} card={card} index={i} />
                  ))}
                </div>
              </section>
            )}

            {page.regular.length > 0 && (
              <section>
                {page.featured.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-500">
                      All projects
                    </h3>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {page.regular.map((card, i) => (
                    <DiscoverCard
                      key={card.subdomain}
                      card={card}
                      index={i + page.featured.length}
                    />
                  ))}
                </div>
              </section>
            )}

            <nav className="flex items-center justify-between gap-3 mt-8">
              <div>
                {cursor > 0 && (
                  <Link
                    href={
                      cursor - DEFAULT_PAGE_SIZE <= 0
                        ? '/discover'
                        : `/discover?cursor=${cursor - DEFAULT_PAGE_SIZE}`
                    }
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Newer
                  </Link>
                )}
              </div>
              <div>
                {page.nextCursor !== null && (
                  <Link
                    href={`/discover?cursor=${page.nextCursor}`}
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-200 hover:text-zinc-50 transition-colors"
                  >
                    Older
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </nav>
          </>
        )}
      </div>
    </main>
  )
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string
  body: string
  ctaHref?: string
  ctaLabel?: string
}) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-10 max-w-xl mx-auto text-center">
      <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-400/20 mx-auto flex items-center justify-center text-violet-300">
        <Compass size={20} />
      </div>
      <h3 className="text-xl font-semibold text-zinc-100 mt-4">{title}</h3>
      <p className="text-sm text-zinc-500 mt-3 leading-relaxed">{body}</p>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-violet-100 bg-violet-500/20 border border-violet-400/30 hover:bg-violet-500/30 transition-colors"
        >
          {ctaLabel}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}
