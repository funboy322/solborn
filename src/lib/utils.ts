import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { STAGE_CONFIG } from './constants'
import type { AgentStage } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nanoid(size = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`
  return xp.toString()
}

export function getXPProgress(xp: number, stage: AgentStage): number {
  const config = STAGE_CONFIG[stage]
  const stageXP = xp - config.xpRequired
  const stageRange = (config.xpToNext as number) - config.xpRequired
  if (stageRange <= 0 || !isFinite(stageRange)) return 100
  return Math.min(100, Math.round((stageXP / stageRange) * 100))
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}
