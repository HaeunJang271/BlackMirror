import { describe, expect, it } from 'vitest'
import { createInitialState, gameReducer } from '../reducer'

describe('광고 부활', () => {
  it('한 런에서 한 번만 촛불 하나로 부활하고 보스 체력을 유지한다', () => {
    const state = { ...createInitialState(42), phase: 'GAME_OVER' as const, stageIndex: 1, bossHp: 37, candles: 0, round: 4 }
    const revived = gameReducer(state, { type: 'REVIVE_AD' })
    expect(revived.phase).toBe('PLAYER_TURN')
    expect(revived.candles).toBe(1)
    expect(revived.bossHp).toBe(37)
    expect(revived.hasUsedRevive).toBe(true)
    const deadAgain = { ...revived, phase: 'GAME_OVER' as const, candles: 0 }
    expect(gameReducer(deadAgain, { type: 'REVIVE_AD' })).toBe(deadAgain)
    const newRun = gameReducer(deadAgain, { type: 'START_RUN' })
    expect(newRun.hasUsedRevive).toBe(false)
  })
})
