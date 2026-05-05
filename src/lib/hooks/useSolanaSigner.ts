'use client'
import { useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { usePrivy } from '@privy-io/react-auth'
import {
  useWallets as usePrivySolanaWallets,
  useSignTransaction as usePrivySignTransaction,
  type ConnectedStandardSolanaWallet,
} from '@privy-io/react-auth/solana'

/**
 * Unified Solana signer — abstracts whether the user is signed in via:
 * - Phantom (wallet-adapter, existing flow)
 * - Privy embedded wallet (email / Google / Apple login)
 *
 * Phantom takes priority if connected, since it's the legacy path most existing
 * code already produces transactions for. Privy is the fallback.
 *
 * The `useSolanaSigner` export is selected at module load:
 *   - if NEXT_PUBLIC_PRIVY_APP_ID is set → uses both signers
 *   - otherwise → Phantom-only (Privy hooks would throw without a provider)
 *
 * Build-time env makes this stable across renders, so React's rules-of-hooks
 * are not violated.
 *
 * Privy v3 note: ConnectedStandardSolanaWallet objects do NOT carry a
 * signTransaction method directly — signing goes through the useSignTransaction
 * hook, which requires the wallet to be passed as part of the input. We capture
 * the hook function once and close over it inside makePrivySigner so the rest of
 * the codebase keeps the simple `(tx) => Promise<tx>` shape.
 */

export interface SolanaSigner {
  source: 'phantom' | 'privy' | null
  connected: boolean
  connecting: boolean
  publicKey: PublicKey | null
  walletAddress: string | null
  signTransaction: (<T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>) | null
}

const PRIVY_ENABLED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID)

function usePhantomOnly(): SolanaSigner {
  const wa = useWallet()
  return useMemo<SolanaSigner>(() => {
    if (wa.connected && wa.publicKey && wa.signTransaction) {
      return {
        source: 'phantom',
        connected: true,
        connecting: wa.connecting,
        publicKey: wa.publicKey,
        walletAddress: wa.publicKey.toBase58(),
        signTransaction: wa.signTransaction as SolanaSigner['signTransaction'],
      }
    }
    return {
      source: null,
      connected: false,
      connecting: wa.connecting,
      publicKey: null,
      walletAddress: null,
      signTransaction: null,
    }
  }, [wa.connected, wa.publicKey, wa.signTransaction, wa.connecting])
}

function usePhantomAndPrivy(): SolanaSigner {
  const wa = useWallet()
  const privy = usePrivy()
  const { wallets: privyWallets, ready: privyReady } = usePrivySolanaWallets()
  const { signTransaction: privySignTx } = usePrivySignTransaction()

  return useMemo<SolanaSigner>(() => {
    // Phantom first
    if (wa.connected && wa.publicKey && wa.signTransaction) {
      return {
        source: 'phantom',
        connected: true,
        connecting: wa.connecting,
        publicKey: wa.publicKey,
        walletAddress: wa.publicKey.toBase58(),
        signTransaction: wa.signTransaction as SolanaSigner['signTransaction'],
      }
    }
    // Privy embedded fallback
    if (privy.authenticated && privyWallets.length > 0) {
      const w = privyWallets[0]
      let pk: PublicKey
      try {
        pk = new PublicKey(w.address)
      } catch {
        return {
          source: null,
          connected: false,
          connecting: false,
          publicKey: null,
          walletAddress: null,
          signTransaction: null,
        }
      }
      return {
        source: 'privy',
        connected: true,
        connecting: false,
        publicKey: pk,
        walletAddress: w.address,
        signTransaction: makePrivySigner(w, privySignTx),
      }
    }
    return {
      source: null,
      connected: false,
      connecting: wa.connecting || !privy.ready || !privyReady,
      publicKey: null,
      walletAddress: null,
      signTransaction: null,
    }
  }, [wa.connected, wa.publicKey, wa.signTransaction, wa.connecting, privy.authenticated, privy.ready, privyReady, privyWallets, privySignTx])
}

/**
 * Bridge a Privy ConnectedStandardSolanaWallet into the wallet-adapter-style
 * `(tx) => Promise<tx>` shape that the rest of the app expects.
 *
 * Privy v3 separates the signing capability from the wallet object itself —
 * the actual signature happens through `useSignTransaction()`, which takes the
 * wallet as an input parameter. We capture both at hook level and close over
 * them here so callers don't see the indirection.
 *
 * Steps:
 *   - Serialize the Transaction (or VersionedTransaction) to bytes
 *   - Call hookSign({ transaction, wallet, chain })
 *   - Rehydrate the signed bytes back into the original transaction shape
 */
type PrivyHookSign = (input: {
  transaction: Uint8Array
  wallet: ConnectedStandardSolanaWallet
  chain?: `solana:${string}`
}) => Promise<{ signedTransaction: Uint8Array }>

function makePrivySigner(
  wallet: ConnectedStandardSolanaWallet,
  hookSign: PrivyHookSign,
): SolanaSigner['signTransaction'] {
  // Default to devnet — matches DEVNET_CONNECTION used elsewhere.
  // If we ever ship to mainnet we'll thread cluster through; for now devnet is hardcoded
  // because every other Solana-touching path in the codebase is also devnet-only.
  const chain: `solana:${string}` = 'solana:devnet'

  return async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
    const isVersioned = 'version' in tx && typeof tx.version !== 'undefined'
    const serialized = isVersioned
      ? (tx as VersionedTransaction).serialize()
      : (tx as Transaction).serialize({ requireAllSignatures: false, verifySignatures: false })

    const { signedTransaction } = await hookSign({
      transaction: new Uint8Array(serialized),
      wallet,
      chain,
    })

    if (isVersioned) {
      return VersionedTransaction.deserialize(signedTransaction) as T
    }
    return Transaction.from(signedTransaction) as T
  }
}

export const useSolanaSigner = PRIVY_ENABLED ? usePhantomAndPrivy : usePhantomOnly
