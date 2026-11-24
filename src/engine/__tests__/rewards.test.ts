import { describe, expect, it } from 'vitest'
import { BOSSES } from '../../data/bosses'
import { ALL_RELIC_IDS } from '../../data/relics'
import type { GameState } from '../../types/game'
import { createInitialState, gameReducer } from '../reducer'

function defeated(stageIndex = 0): GameState {
  const state = createInitialState(123)
  return gameReducer({ ...state, stageIndex, phase: 'RESOLVING', candles: 2,
    hand: ['salt_circle'], spentRituals: ['blood_pact', 'clairvoyant_coin'], bossHp: 0,
    resolve: { kind: 'cash_out', damage: 10, message: null, candlesBefore: 2, candlesAfter: 2, next: 'reward', durationMs: 1 },
  }, { type: 'FINISH_RESOLVE' })
}

describe('스테이지 보상', () => {
  it('세 스테이지의 체력과 제한 시간을 적용한다', () => {
    expect(BOSSES.map((boss) => boss.maxHp)).toEqual([60, 100, 150])
    expect(BOSSES.map((boss) => boss.turnTimerSec)).toEqual([12, 10, 8])
  })

  it('유물 세 개를 제안하고 의식 두 장을 보충한다', () => {
    const state = defeated()
    expect(state.reward?.relicOptions).toHaveLength(3)
    const relicId = state.reward!.relicOptions[1]!
    const next = gameReducer(state, { type: 'SELECT_REWARD', relicId, choice: 'rituals' })
    expect(next.phase).toBe('STAGE_INTRO')
    expect(next.stageIndex).toBe(1)
    expect(next.relics).toContain(relicId)
    expect(next.hand).toHaveLength(3)
    expect(new Set(next.hand).size).toBe(3)
    expect(next.candles).toBe(2)
  })

  it('촛불 보상은 손패 대신 촛불을 되살린다', () => {
    const state = defeated()
    const next = gameReducer(state, { type: 'SELECT_REWARD', relicId: state.reward!.relicOptions[0]!, choice: 'candle' })
    expect(next.phase).toBe('STAGE_INTRO')
    expect(next.candles).toBe(3)
    expect(next.hand).toEqual(state.hand)
  })

  it('마지막 보스를 처치하면 보상 선택 없이 승리한다', () => {
    const initial = createInitialState(123)
    const state = gameReducer({ ...initial, phase: 'PLAYER_TURN', stageIndex: 2, bossHp: 1, candles: 2,
      turn: { ...initial.turn, consecutiveTruths: 1, openedTruthBaseScores: [10] },
    }, { type: 'CASH_OUT' })
    expect(state.phase).toBe('RESOLVING')
    expect(state.resolve?.next).toBe('reward')
    const next = gameReducer(state, { type: 'FINISH_RESOLVE' })
    expect(next.phase).toBe('VICTORY')
    expect(next.reward).toBeNull()
    expect(next.candles).toBe(2)
  })

  it('제시되지 않은 유물은 선택할 수 없다', () => {
    const state = defeated()
    const unavailable = ALL_RELIC_IDS.find((id) => !state.reward!.relicOptions.includes(id))!
    expect(gameReducer(state, { type: 'SELECT_REWARD', relicId: unavailable, choice: 'rituals' })).toBe(state)
  })

  it('소모 의식이 없거나 촛불이 가득 차도 보상 선택을 완료할 수 있다', () => {
    const state = { ...defeated(), spentRituals: [], candles: 3 }
    const next = gameReducer(state, { type: 'SELECT_REWARD', relicId: state.reward!.relicOptions[0]!, choice: 'candle' })
    expect(next.phase).toBe('STAGE_INTRO')
    expect(next.candles).toBe(3)
    expect(next.hand).toEqual(state.hand)
  })
})
