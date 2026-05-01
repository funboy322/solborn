/**
 * Real Solana NFT Passport minting via Metaplex Core.
 *
 * Why Core (not Bubblegum, not Token Metadata):
 *   - Core is the new Metaplex standard — single account per asset, no tree
 *     setup required, simpler API. Anyone can mint without pre-provisioning.
 *   - Bubblegum (cNFTs) needs a tree address (NEXT_PUBLIC_BUBBLEGUM_TREE).
 *     If the tree doesn't exist or fills up, mints break. Avoid for hackathon.
 *   - Token Metadata is heavier (mint + ATA + metadata + master edition).
 *
 * The user's wallet pays the tx fee and is the asset owner. The asset shows
 * up in Phantom and on Solana Explorer / Magic Eden as a real NFT.
 *
 * Works with both Phantom (wallet-adapter) and Privy embedded wallets via
 * the unified SolanaSigner from useSolanaSigner.
 */
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  generateSigner,
  publicKey as umiPublicKey,
  signerIdentity,
  type Signer,
  type Umi,
  type Transaction as UmiTransaction,
} from '@metaplex-foundation/umi'
import { mplCore, create } from '@metaplex-foundation/mpl-core'
import { fromWeb3JsTransaction, toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { base58 } from '@metaplex-foundation/umi/serializers'
import type { ForgeAgent } from '../types'
import type { SolanaSigner } from '../hooks/useSolanaSigner'

const RPC = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com'

export interface CoreMintResult {
  /** The on-chain asset address (a real NFT, viewable in Phantom / Explorer / Magic Eden) */
  assetAddress: string
  /** Transaction signature for the mint */
  txSignature: string
  /** Solana Explorer link to the tx */
  explorerUrl: string
  /** Magic Eden link to the asset */
  magicEdenUrl: string
  network: 'devnet'
}

/**
 * Builds the metadata URI that Core stores on-chain. Resolves to a JSON
 * document served by /api/nft-metadata, snapshotted at mint time so each
 * stage evolution produces a distinct on-chain artifact.
 */
function buildMetadataUri(agent: ForgeAgent): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://solborn.xyz'
  const params = new URLSearchParams({
    id: agent.id,
    n: agent.name,
    s: agent.stage,
    p: agent.personality,
    xp: String(agent.xp),
    i: String(agent.totalInteractions),
    c: String(agent.traits.curiosity ?? 0),
    sk: String(agent.traits.solanaKnowledge ?? 0),
    cd: String(agent.traits.codingSkill ?? 0),
    cr: String(agent.traits.creativity ?? 0),
    fm: String(agent.traits.founderMindset ?? 0),
  })
  return `${origin}/api/nft-metadata?${params.toString()}`
}

/**
 * Wraps our unified SolanaSigner (which signs web3.js Transactions) into
 * a UMI Signer (which signs UMI Transactions). Bridges by converting
 * UMI ↔ web3.js around our existing signTransaction.
 */
function buildUmiSigner(
  pk: PublicKey,
  signTx: NonNullable<SolanaSigner['signTransaction']>,
): Signer {
  return {
    publicKey: umiPublicKey(pk.toBase58()),
    signMessage: async () => {
      throw new Error('signMessage is not used by mpl-core mint flow')
    },
    signTransaction: async (umiTx: UmiTransaction) => {
      const web3Tx = toWeb3JsTransaction(umiTx)
      // toWeb3JsTransaction returns a VersionedTransaction; sign it in-place
      const signed = await signTx<VersionedTransaction | Transaction>(web3Tx)
      return fromWeb3JsTransaction(signed as VersionedTransaction)
    },
    signAllTransactions: async (txs: UmiTransaction[]) => {
      const signed: UmiTransaction[] = []
      for (const tx of txs) {
        const web3Tx = toWeb3JsTransaction(tx)
        const out = await signTx<VersionedTransaction | Transaction>(web3Tx)
        signed.push(fromWeb3JsTransaction(out as VersionedTransaction))
      }
      return signed
    },
  }
}

function buildUmi(pk: PublicKey, signTx: NonNullable<SolanaSigner['signTransaction']>): Umi {
  return createUmi(RPC).use(mplCore()).use(signerIdentity(buildUmiSigner(pk, signTx)))
}

/**
 * Mints a Core NFT Passport for the agent. The asset goes to the user's
 * wallet — they own it, can transfer it, and it appears in Phantom.
 */
export async function mintCorePassport(
  agent: ForgeAgent,
  signer: SolanaSigner,
): Promise<CoreMintResult> {
  if (!signer.publicKey || !signer.signTransaction) {
    throw new Error('Wallet not connected. Sign in or connect Phantom first.')
  }

  const umi = buildUmi(signer.publicKey, signer.signTransaction)
  const asset = generateSigner(umi)

  const name = `${agent.name} · ${capitalize(agent.stage)}`.slice(0, 32)
  const uri = buildMetadataUri(agent)

  const builder = create(umi, {
    asset,
    name,
    uri,
    owner: umi.identity.publicKey,
  })

  const { signature } = await builder.sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' },
  })

  const txSignature = base58.deserialize(signature)[0]
  const assetAddress = asset.publicKey

  return {
    assetAddress,
    txSignature,
    explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    magicEdenUrl: `https://magiceden.io/item-details/${assetAddress}?network=devnet`,
    network: 'devnet',
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
