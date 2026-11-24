import { describe, expect, it } from 'vitest'
import { createInitialState, gameReducer } from '../reducer'

describe('RESOLVING 인터미션', () => {
  it('정산 후 RESOLVING을 거쳐 다음 라운드로 간다', () => {
    let state = createInitialState(11)
    state = gameReducer(state, { type: 'START_RUN' })
    state = gameReducer(state, { type: 'CONFIRM_INTRO' })

    const truth = state.board.find((c) => c.face === 'truth')!
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: truth.id })
    expect(state.turn.timerStarted).toBe(true)

    state = gameReducer(state, { type: 'CASH_OUT' })
    expect(state.phase).toBe('RESOLVING')
    expect(state.resolve?.kind).toBe('cash_out')
    expect(state.resolve?.damage).toBeGreaterThan(0)

    const roundBefore = state.round
    state = gameReducer(state, { type: 'FINISH_RESOLVE' })
    expect(state.phase).toBe('PLAYER_TURN')
    expect(state.round).toBe(roundBefore + 1)
  })

  it('타이머는 첫 플립 전까지 시작되지 않은 상태다', () => {
    let state = createInitialState(22)
    state = gameReducer(state, { type: 'START_RUN' })
    state = gameReducer(state, { type: 'CONFIRM_INTRO' })
    expect(state.turn.timerStarted).toBe(false)
  })
})
