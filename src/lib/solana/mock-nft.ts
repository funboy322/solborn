/**
 * Mock compressed NFT operations for devnet.
 * Real implementation would use @metaplex-foundation/mpl-bubblegum.
 * For hackathon MVP: simulates the on-chain state without actual transactions.
 */

import type { ForgeAgent, NFTMetadata } from '../types'
import { STAGE_CONFIG } from '../constants'
import { nanoid } from '../utils'

const MOCK_DELAY = 1500 // simulate network latency

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Generate a fake-looking Solana address */
function fakePubkey(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Generate a fake transaction signature */
function fakeTxSig(): string {
  const chars = '0123456789abcdef'
  return Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export interface MintResult {
  mintAddress: string
  txSignature: string
  metadata: NFTMetadata
  explorerUrl: string
}

/**
 * Simulate minting a compressed NFT for the agent.
 * In production: use Helius DAS API + @metaplex-foundation/mpl-bubblegum
 */
export async function mintAgentNFT(agent: ForgeAgent): Promise<MintResult> {
  await sleep(MOCK_DELAY)

  const mintAddress = fakePubkey()
  const txSignature = fakeTxSig()
  const stageConfig = STAGE_CONFIG[agent.stage]

  const metadata: NFTMetadata = {
    name: `${agent.name} #${agent.id.slice(0, 4).toUpperCase()}`,
    symbol: 'SOLBORN',
    uri: `https://solborn.xyz/api/nft/${agent.id}`,
    attributes: [
      { trait_type: 'Stage', value: stageConfig.label },
      { trait_type: 'Personality', value: agent.personality },
      { trait_type: 'Curiosity', value: agent.traits.curiosity },
      { trait_type: 'Creativity', value: agent.traits.creativity },
      { trait_type: 'Technical', value: agent.traits.technical },
      { trait_type: 'Hustle', value: agent.traits.hustle },
      { trait_type: 'Vision', value: agent.traits.vision },
      { trait_type: 'XP', value: agent.xp },
      { trait_type: 'Total Interactions', value: agent.totalInteractions },
    ],
    mintAddress,
    network: 'devnet',
  }

  return {
    mintAddress,
    txSignature,
    metadata,
    explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`,
  }
}

/** Simulate updating on-chain metadata after evolution */
export async function updateAgentNFT(
  mintAddress: string,
  agent: ForgeAgent
): Promise<{ txSignature: string }> {
  await sleep(MOCK_DELAY)
  return { txSignature: fakeTxSig() }
}

/** Simulate deploying a Solana program */
export async function deployMockProgram(
  programName: string
): Promise<{ programId: string; txSignature: string; explorerUrl: string }> {
  await sleep(MOCK_DELAY * 2)
  const programId = fakePubkey()
  const txSignature = fakeTxSig()
  return {
    programId,
    txSignature,
    explorerUrl: `https://explorer.solana.com/address/${programId}?cluster=devnet`,
  }
}
