import { describe, expect, it } from 'vitest'
import type { GameState, RitualId } from '../../types/game'
import { createInitialState, gameReducer } from '../reducer'

function startPlaying(seed = 42): GameState {
  let state = createInitialState(seed)
  state = gameReducer(state, { type: 'START_RUN' })
  state = gameReducer(state, { type: 'CONFIRM_INTRO' })
  return state
}

function withAshBreath(state: GameState, candles: number): GameState {
  const hand: RitualId[] = [
    ...state.hand.filter((id) => id !== 'ash_breath'),
    'ash_breath',
  ]
  return { ...state, hand, candles }
}

describe('재의 숨결', () => {
  it('꺼진 촛불이 있으면 사용 즉시 1개 재점화한다', () => {
    let state = withAshBreath(startPlaying(), 2)
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'ash_breath' })
    expect(state.candles).toBe(3)
    expect(state.ashBreathUsedThisRun).toBe(true)
    expect(state.ashBreathPending).toBe(false)
    expect(state.hand.includes('ash_breath')).toBe(false)
  })

  it('촛불이 모두 켜져 있으면 사용할 수 없고 손패를 유지한다', () => {
    const state = withAshBreath(startPlaying(11), 3)
    const result = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'ash_breath' })
    expect(result).toBe(state)
  })

  it('이미 사용/대기면 손패를 다시 깎지 않는다', () => {
    let state = withAshBreath(startPlaying(7), 2)
    state = { ...state, ashBreathPending: true, hand: ['ash_breath', 'salt_circle'] }
    const before = [...state.hand]
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'ash_breath' })
    expect(state.hand).toEqual(before)
  })
})
