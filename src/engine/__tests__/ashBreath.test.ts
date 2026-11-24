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

  it('촛불이 풀이면 pending으로 두고 정산 때 재점화한다', () => {
    let state = withAshBreath(startPlaying(11), 3)
    state = {
      ...state,
      board: state.board.map((c, i) =>
        i === 0
          ? { ...c, face: 'truth' as const, revealed: false, removed: false }
          : c,
      ),
    }

    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'ash_breath' })
    expect(state.candles).toBe(3)
    expect(state.ashBreathPending).toBe(true)

    // 저주로 촛불 감소
    state = {
      ...state,
      board: state.board.map((c, i) =>
        i === 1
          ? { ...c, face: 'curse' as const, revealed: false, removed: false }
          : c,
      ),
    }
    const curseId = state.board[1]!.id
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: curseId })
    expect(state.candles).toBe(2)
    expect(state.ashBreathPending).toBe(true)

    state = gameReducer(state, { type: 'FINISH_RESOLVE' })
    const truth = state.board.find((c) => c.face === 'truth' && !c.revealed)
    expect(truth).toBeTruthy()
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: truth!.id })
    state = gameReducer(state, { type: 'CASH_OUT' })
    expect(state.candles).toBe(3)
    expect(state.ashBreathUsedThisRun).toBe(true)
    expect(state.ashBreathPending).toBe(false)
  })

  it('이미 사용/대기면 손패를 다시 깎지 않는다', () => {
    let state = withAshBreath(startPlaying(7), 2)
    state = { ...state, ashBreathPending: true, hand: ['ash_breath', 'salt_circle'] }
    const before = [...state.hand]
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'ash_breath' })
    expect(state.hand).toEqual(before)
  })
})
