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

  it('타이머는 첫 행동을 기다린 다음 시작된다', () => {
    let state = createInitialState(22)
    state = gameReducer(state, { type: 'START_RUN' })
    state = gameReducer(state, { type: 'CONFIRM_INTRO' })
    expect(state.turn.timerStarted).toBe(false)
    const truth = state.board.find((c) => c.face === 'truth')!
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: truth.id })
    expect(state.turn.timerStarted).toBe(true)
  })

  it('의식 사용은 첫 패를 열기 전 타이머를 시작하지 않고 시작된 타이머도 유지한다', () => {
    let state = gameReducer(createInitialState(22), { type: 'START_RUN' })
    state = gameReducer(state, { type: 'CONFIRM_INTRO' })
    state = { ...state, hand: ['ash_breath', 'salt_circle', 'blood_pact'] }
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'ash_breath' })
    expect(state.turn.timerStarted).toBe(false)
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'salt_circle' })
    expect(state.turn.timerStarted).toBe(false)
    const truth = state.board.find((card) => card.face === 'truth')!
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: truth.id })
    expect(state.turn.timerStarted).toBe(true)
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'blood_pact' })
    expect(state.turn.timerStarted).toBe(true)
  })

  it('턴이 시작될 때마다 손패가 가득 차지 않았다면 의식 한 장을 보충한다', () => {
    let state = gameReducer(createInitialState(22), { type: 'START_RUN' })
    expect(state.hand).toHaveLength(2)
    state = gameReducer(state, { type: 'CONFIRM_INTRO' })
    expect(state.hand).toHaveLength(3)
    const truth = state.board.find((card) => card.face === 'truth')!
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: truth.id })
    state = gameReducer(state, { type: 'CASH_OUT' })
    state = gameReducer(state, { type: 'FINISH_RESOLVE' })
    expect(state.hand).toHaveLength(4)
    expect(new Set(state.hand).size).toBe(4)
  })
})
