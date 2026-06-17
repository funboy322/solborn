/**
 * Server-side $SBORN balance lookup, used by the token-gating perks system.
 *
 * No locks, no staking — we read the wallet's actual SPL token balance
 * and decide "holder vs not-holder" at the moment of the check. The mirror
 * snapshot in Redis caches the result at claim/sync time so /discover
 * doesn't hit the RPC on every render; the /api/sborn/balance route is
 * the live path used by UI badges.
 *
 * Helius mainnet RPC is the only endpoint that handles getTokenAccountsByOwner
 * reliably under load — the public endpoint frequently 429s. We fall back to
 * clusterApiUrl('mainnet-beta') if HELIUS env is unset (returns 0 on failure
 * rather than throwing, so the UI degrades to "non-holder").
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { SBORN_TOKEN_ADDRESS } from './staking'

const SBORN_MINT = new PublicKey(SBORN_TOKEN_ADDRESS)

// Token-2022 owner program (we verified this earlier via getAccountInfo on the mint).
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
)

interface CachedBalance {
  value: number
  expiresAt: number
}

const CACHE_TTL_MS = 60_000
const CACHE_MAX = 500
const cache = new Map<string, CachedBalance>()

function pruneCache() {
  if (cache.size <= CACHE_MAX) return
  const now = Date.now()
  for (const [k, v] of cache) {
    if (v.expiresAt < now) cache.delete(k)
  }
  while (cache.size > CACHE_MAX) {
    const firstKey = cache.keys().next().value
    if (firstKey === undefined) break
    cache.delete(firstKey)
  }
}

function getMainnetConnection(): Connection {
  const rpc = process.env.NEXT_PUBLIC_HELIUS_RPC_MAINNET || clusterApiUrl('mainnet-beta')
  return new Connection(rpc, 'confirmed')
}

/**
 * Returns the wallet's total $SBORN balance in whole tokens (uiAmount),
 * summed across every SPL Token-2022 account it owns for the mint.
 *
 * Returns 0 if:
 *   - wallet has no token accounts for $SBORN
 *   - RPC times out / errors
 *   - input wallet is unparseable
 *
 * Cached 60s per wallet to keep Helius quota healthy when /discover
 * iterates a page of cards.
 */
export async function getSbornBalance(walletAddress: string): Promise<number> {
  if (!walletAddress) return 0
  const cached = cache.get(walletAddress)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  let owner: PublicKey
  try {
    owner = new PublicKey(walletAddress)
  } catch {
    return 0
  }

  try {
    const conn = getMainnetConnection()
    // First try with default program ID (legacy SPL Token).
    const response = await conn.getParsedTokenAccountsByOwner(
      owner,
      { mint: SBORN_MINT },
      'confirmed'
    )

    let total = 0
    for (const { account } of response.value) {
      const info = (account.data as { parsed?: { info?: { tokenAmount?: { uiAmount?: number } } } })
        .parsed?.info?.tokenAmount
      if (info && typeof info.uiAmount === 'number') {
        total += info.uiAmount
      }
    }

    // If we found nothing, retry against the Token-2022 program ID since
    // $SBORN was minted under it.
    if (total === 0) {
      const tokenProgResponse = await conn.getParsedTokenAccountsByOwner(
        owner,
        { mint: SBORN_MINT, programId: TOKEN_2022_PROGRAM_ID },
        'confirmed'
      )
      for (const { account } of tokenProgResponse.value) {
        const info = (account.data as { parsed?: { info?: { tokenAmount?: { uiAmount?: number } } } })
          .parsed?.info?.tokenAmount
        if (info && typeof info.uiAmount === 'number') {
          total += info.uiAmount
        }
      }
    }

    cache.set(walletAddress, { value: total, expiresAt: Date.now() + CACHE_TTL_MS })
    pruneCache()
    return total
  } catch (e) {
    console.warn('[sborn-balance] rpc error', e instanceof Error ? e.message : e)
    // Don't cache failures — next call retries.
    return 0
  }
}
