import type { BossDef, ResolveInfo } from '../types/game'

export function getBossReaction(boss: BossDef, resolve: ResolveInfo | null): string | null {
  if (resolve?.kind === 'cash_out') return boss.hitLine
  if (resolve?.kind === 'curse' && resolve.candlesAfter < resolve.candlesBefore) return boss.curseLine
  return null
}

export function getBossLine(boss: BossDef, hp: number, candles: number, reaction: string | null): string {
  if (hp <= 0) return boss.defeatLine
  if (reaction) return reaction
  if (candles === 1 && boss.lastCandleLine) return boss.lastCandleLine
  return boss.introLine
}
