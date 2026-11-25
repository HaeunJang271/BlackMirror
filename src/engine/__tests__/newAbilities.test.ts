import { describe, expect, it } from 'vitest'
import { BOSSES } from '../../data/bosses'
import type { RelicId } from '../../types/game'
import { calculateDamage } from '../calculator'
import { createInitialState, gameReducer, toDamageInput } from '../reducer'

function turn() {
  let state = gameReducer(createInitialState(24), { type: 'START_RUN' })
  state = gameReducer({ ...state, stageIndex: 2 }, { type: 'CONFIRM_INTRO' })
  return { ...state, hand: ['truth_bell', 'scale_flip', 'sand_glass', 'soul_candelabra'] as const as typeof state.hand }
}

describe('신규 의식과 유물', () => {
  it('진실의 종은 정상 공개하고 저울질은 저주를 진실로 바꾸며 대상이 없으면 소모하지 않는다', () => {
    let state = turn()
    const truth = state.board.find((c) => c.face === 'truth')!
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'truth_bell' })
    expect(state.board.find((c) => c.id === truth.id)?.revealed).toBe(true)
    expect(state.turn.consecutiveTruths).toBe(1)
    expect(state.turn.timerStarted).toBe(true)
    const curses = state.board.filter((c) => c.face === 'curse').length
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'scale_flip' })
    expect(state.board.filter((c) => c.face === 'curse')).toHaveLength(curses - 1)
    const noCurse = { ...state, hand: ['scale_flip'] as typeof state.hand, board: state.board.map((c) => ({ ...c, face: 'truth' as const })) }
    expect(gameReducer(noCurse, { type: 'USE_RITUAL', ritualId: 'scale_flip' })).toBe(noCurse)
  })

  it('시간과 진실 수 배수 및 의식 두 장 성배를 함께 적용한다', () => {
    let state = { ...turn(), relics: ['chalice_of_ruin'] as RelicId[] }
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'sand_glass' })
    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'soul_candelabra' })
    for (const card of state.board.filter((c) => c.face === 'truth')) state = gameReducer(state, { type: 'FLIP_CARD', cardId: card.id })
    expect(state.turn.timerBonusSec).toBe(6)
    const damage = calculateDamage(toDamageInput(state))
    expect(damage.comboMultiplier).toBeCloseTo(5.7)
    expect(damage.finalDamage).toBe(342)
  })

  it('촛농의 부적은 스테이지당 한 번 저주를 방어한다', () => {
    let state = { ...turn(), relics: ['wax_charm'] as RelicId[] }
    const curses = state.board.filter((c) => c.face === 'curse')
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: curses[0]!.id })
    expect(state.phase).toBe('PLAYER_TURN')
    expect(state.candles).toBe(3)
    expect(state.waxCharmUsed).toBe(true)
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: curses[1]!.id })
    expect(state.candles).toBe(2)
  })

  it('황금 저울판은 가득 찬 손패에도 새 의식을 지급하고 부적을 초기화한다', () => {
    const state = { ...turn(), stageIndex: 0, phase: 'REWARD' as const, waxCharmUsed: true, reward: { relicOptions: ['golden_pan' as const] } }
    const next = gameReducer(state, { type: 'SELECT_REWARD', relicId: 'golden_pan', choice: 'candle' })
    expect(next.hand).toHaveLength(5)
    expect(new Set(next.hand).size).toBe(5)
    expect(next.waxCharmUsed).toBe(false)
    expect(next.bossHp).toBe(BOSSES[1]!.maxHp)
  })
})
