import { describe, expect, it } from 'vitest'
import type { DamageInput } from '../../types/game'
import {
  calculateDamage,
  getCardBaseScore,
  getComboMultiplier,
} from '../calculator'
import {
  createInitialState,
  gameReducer,
  toDamageInput,
} from '../reducer'

function baseInput(partial: Partial<DamageInput> = {}): DamageInput {
  return {
    consecutiveTruths: 0,
    openedTruthBaseScores: [],
    forbiddenHandBonus: 0,
    ritualsUsedThisTurn: [],
    bloodPactActive: false,
    relics: [],
    candles: 3,
    cursesHitThisRun: 0,
    bossThirdSuccessBonus: 0,
    bossLastCandleMult: 1,
    rustyWeightActive: false,
    ...partial,
  }
}

describe('기본 콤보 배수', () => {
  it('1~4장 연속 성공 점수와 배수가 PRD 표를 따른다', () => {
    expect(getCardBaseScore(1)).toBe(10)
    expect(getCardBaseScore(2)).toBe(15)
    expect(getCardBaseScore(3)).toBe(20)
    expect(getCardBaseScore(4)).toBe(30)

    expect(getComboMultiplier(1)).toBe(1.0)
    expect(getComboMultiplier(2)).toBe(1.5)
    expect(getComboMultiplier(3)).toBe(2.5)
    expect(getComboMultiplier(4)).toBe(4.0)
  })

  it('누적 기본 점수 × 콤보로 최종 데미지를 계산한다', () => {
    const two = calculateDamage(
      baseInput({
        consecutiveTruths: 2,
        openedTruthBaseScores: [10, 15],
      }),
    )
    // (10+15) × 1.5 = 37.5 → 38
    expect(two.finalDamage).toBe(38)

    const three = calculateDamage(
      baseInput({
        consecutiveTruths: 3,
        openedTruthBaseScores: [10, 15, 20],
      }),
    )
    // 45 × 2.5 = 112.5 → 113
    expect(three.finalDamage).toBe(113)
  })

  it('시계공 3장째 보너스 +0.5를 콤보에 가산한다', () => {
    const result = calculateDamage(
      baseInput({
        consecutiveTruths: 3,
        openedTruthBaseScores: [10, 15, 20],
        bossThirdSuccessBonus: 0.5,
      }),
    )
    expect(result.comboMultiplier).toBe(3.0)
    expect(result.finalDamage).toBe(135)
  })
})

describe('부러진 초침', () => {
  it('진실을 정확히 2장만 열고 정산하면 ×1.8이 적용된다', () => {
    const exactTwo = calculateDamage(
      baseInput({
        consecutiveTruths: 2,
        openedTruthBaseScores: [10, 15],
        relics: ['broken_hand'],
      }),
    )
    // 25 × 1.5 × 1.8 = 67.5 → 68
    expect(exactTwo.relicMultiplier).toBeCloseTo(1.8)
    expect(exactTwo.finalDamage).toBe(68)
  })

  it('1장 또는 3장 정산에는 부러진 초침이 발동하지 않는다', () => {
    const one = calculateDamage(
      baseInput({
        consecutiveTruths: 1,
        openedTruthBaseScores: [10],
        relics: ['broken_hand'],
      }),
    )
    expect(one.relicMultiplier).toBe(1)
    expect(one.finalDamage).toBe(10)

    const three = calculateDamage(
      baseInput({
        consecutiveTruths: 3,
        openedTruthBaseScores: [10, 15, 20],
        relics: ['broken_hand'],
      }),
    )
    expect(three.relicMultiplier).toBe(1)
  })
})

describe('피의 서약 + 젖은 성냥갑 곱연산', () => {
  it('의식 ×2와 유물 ×2.5가 곱해진다', () => {
    const result = calculateDamage(
      baseInput({
        consecutiveTruths: 2,
        openedTruthBaseScores: [10, 15],
        bloodPactActive: true,
        relics: ['wet_matchbox'],
        candles: 1,
      }),
    )
    // 25 × 1.5 × 2 × 2.5 = 187.5 → 188
    expect(result.ritualMultiplier).toBe(2)
    expect(result.relicMultiplier).toBeCloseTo(2.5)
    expect(result.finalDamage).toBe(188)
  })
})

describe('소금의 원 저주 방어', () => {
  it('저주를 밟아도 촛불을 잃지 않고 점수를 유지한 채 정산한다', () => {
    let state = createInitialState(42)
    state = gameReducer(state, { type: 'START_RUN' })
    state = gameReducer(state, { type: 'CONFIRM_INTRO' })

    // 손패에 소금의 원 강제 장착
    state = {
      ...state,
      hand: ['salt_circle'],
      board: state.board.map((c, i) =>
        i === 0
          ? { ...c, face: 'truth', revealed: false, removed: false }
          : i === 1
            ? { ...c, face: 'curse', revealed: false, removed: false }
            : c,
      ),
    }

    const truthId = state.board[0]!.id
    const curseId = state.board[1]!.id

    state = gameReducer(state, { type: 'USE_RITUAL', ritualId: 'salt_circle' })
    expect(state.turn.saltCircleActive).toBe(true)

    state = gameReducer(state, { type: 'FLIP_CARD', cardId: truthId })
    expect(state.turn.consecutiveTruths).toBe(1)
    expect(state.candles).toBe(3)

    const hpBefore = state.bossHp
    state = gameReducer(state, { type: 'FLIP_CARD', cardId: curseId })

    // 촛불 유지, 데미지 적용(즉시 정산), 저주 카운트는 방어라 증가하지 않음
    expect(state.candles).toBe(3)
    expect(state.cursesHitThisRun).toBe(0)
    expect(state.lastDamage).toBeGreaterThan(0)
    expect(state.bossHp).toBeLessThan(hpBefore)
  })
})

describe('예상 데미지 헬퍼', () => {
  it('toDamageInput이 현재 턴 상태를 반영한다', () => {
    let state = createInitialState(7)
    state = gameReducer(state, { type: 'START_RUN' })
    state = gameReducer(state, { type: 'CONFIRM_INTRO' })
    state = {
      ...state,
      turn: {
        ...state.turn,
        consecutiveTruths: 2,
        openedTruthBaseScores: [10, 15],
        bloodPactActive: true,
      },
      relics: ['wet_matchbox'],
      candles: 1,
    }
    const input = toDamageInput(state)
    const dmg = calculateDamage(input)
    expect(dmg.finalDamage).toBe(188)
  })
})
