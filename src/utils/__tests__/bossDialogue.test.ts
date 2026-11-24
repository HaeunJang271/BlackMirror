import { describe, expect, it } from 'vitest'
import { BOSSES } from '../../data/bosses'
import type { ResolveInfo } from '../../types/game'
import { getBossLine, getBossReaction } from '../bossDialogue'

const result: ResolveInfo = {
  kind: 'curse', damage: 0, message: null, candlesBefore: 2,
  candlesAfter: 1, next: 'round', durationMs: 850,
}

describe('계약자 대사', () => {
  it('각 보스의 피격과 촛불이 꺼지는 저주에 맞는 대사를 고른다', () => {
    for (const boss of BOSSES) {
      expect(getBossReaction(boss, { ...result, kind: 'cash_out' })).toBe(boss.hitLine)
      expect(getBossReaction(boss, result)).toBe(boss.curseLine)
      expect(getBossReaction(boss, { ...result, kind: 'timeout' })).toBeNull()
      expect(getBossReaction(boss, { ...result, candlesAfter: 2 })).toBeNull()
    }
  })

  it('저주 반응 다음에 마지막 촛불 대사를 보여주며 처치 대사를 우선한다', () => {
    const boss = BOSSES[2]!
    expect(getBossLine(boss, 10, 1, boss.curseLine)).toBe(boss.curseLine)
    expect(getBossLine(boss, 10, 1, null)).toBe(boss.lastCandleLine)
    expect(getBossLine(boss, 0, 1, boss.hitLine)).toBe(boss.defeatLine)
    expect(getBossLine(boss, 10, 2, null)).toBe(boss.introLine)
  })
})
