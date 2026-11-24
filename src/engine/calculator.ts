import type { DamageBreakdown, DamageInput } from '../types/game'

/** 연속 성공 n장째(1-indexed)의 기본 점수 */
export const CARD_BASE_SCORES = [10, 15, 20, 30] as const

/** 연속 성공 n장일 때의 기본 콤보 배수 */
export const COMBO_MULTIPLIERS = [1.0, 1.5, 2.5, 4.0] as const

/**
 * n장째(1-indexed) 진실 카드의 기본 점수를 반환한다.
 */
export function getCardBaseScore(index1Based: number): number {
  if (index1Based < 1) return 0
  const idx = Math.min(index1Based, CARD_BASE_SCORES.length) - 1
  return CARD_BASE_SCORES[idx]!
}

/**
 * 연속 성공 장수에 대한 기본 콤보 배수를 반환한다.
 * 녹슨 저울추가 있으면 최소 ×1.5로 시작한다.
 */
export function getComboMultiplier(
  consecutiveTruths: number,
  options: { rustyWeight?: boolean; bossThirdSuccessBonus?: number } = {},
): number {
  if (consecutiveTruths <= 0) {
    // 시작 표시·녹슨 저울추: 미오픈 상태에서도 ×1.0 (또는 ×1.5)로 둔다
    return options.rustyWeight ? 1.5 : 1.0
  }
  const idx = Math.min(consecutiveTruths, COMBO_MULTIPLIERS.length) - 1
  let mult: number = COMBO_MULTIPLIERS[idx]!
  if (options.rustyWeight) {
    mult = Math.max(mult, 1.5)
  }
  if (consecutiveTruths >= 3 && options.bossThirdSuccessBonus) {
    mult += options.bossThirdSuccessBonus
  }
  return mult
}

/**
 * 까마귀 깃털을 반영한 턴 누적 기본 점수를 계산한다.
 * 진실 3장 이상이면 마지막 카드 기여분이 ×3이 된다.
 */
export function computeTurnBaseScore(
  openedTruthBaseScores: number[],
  hasCrowFeather: boolean,
): number {
  if (openedTruthBaseScores.length === 0) return 0
  if (!hasCrowFeather || openedTruthBaseScores.length < 3) {
    return openedTruthBaseScores.reduce((sum, s) => sum + s, 0)
  }
  return openedTruthBaseScores.reduce((sum, score, index) => {
    const isLast = index === openedTruthBaseScores.length - 1
    return sum + (isLast ? score * 3 : score)
  }, 0)
}

/**
 * 유물 합연산 보너스 (금 간 거울 등).
 */
export function computeAdditiveBonus(input: DamageInput): number {
  let bonus = input.forbiddenHandBonus
  if (
    input.relics.includes('cracked_mirror') &&
    input.ritualsUsedThisTurn.length > 0
  ) {
    bonus += 20
  }
  return bonus
}

/**
 * 의식 카드 곱연산 배수.
 */
export function computeRitualMultiplier(input: DamageInput): number {
  return input.bloodPactActive ? 2 : 1
}

/**
 * 유물·보스 기믹 곱연산 배수를 합산한다.
 * 부러진 초침 / 젖은 성냥갑 / 재투성이 인장 / 보스 최후 촛불을 곱한다.
 */
export function computeRelicMultiplier(input: DamageInput): number {
  let mult = 1

  if (
    input.relics.includes('broken_hand') &&
    input.consecutiveTruths === 2
  ) {
    mult *= 1.8
  }

  if (input.relics.includes('wet_matchbox') && input.candles === 1) {
    mult *= 2.5
  }

  if (input.relics.includes('ashen_seal') && input.cursesHitThisRun > 0) {
    mult *= 1 + 0.15 * input.cursesHitThisRun
  }

  if (input.candles === 1 && input.bossLastCandleMult > 1) {
    mult *= input.bossLastCandleMult
  }

  return mult
}

/**
 * 최종 데미지를 순수하게 계산한다.
 * 식: round((기본점수 + 합연산) × 콤보 × 의식 × 유물)
 */
export function calculateDamage(input: DamageInput): DamageBreakdown {
  const hasCrow = input.relics.includes('crow_feather')
  const baseScore = computeTurnBaseScore(input.openedTruthBaseScores, hasCrow)
  const additiveBonus = computeAdditiveBonus(input)
  const comboMultiplier = getComboMultiplier(input.consecutiveTruths, {
    rustyWeight: input.rustyWeightActive,
    bossThirdSuccessBonus: input.bossThirdSuccessBonus,
  })
  const ritualMultiplier = computeRitualMultiplier(input)
  const relicMultiplier = computeRelicMultiplier(input)

  const finalDamage = Math.round(
    (baseScore + additiveBonus) *
      comboMultiplier *
      ritualMultiplier *
      relicMultiplier,
  )

  return {
    baseScore,
    additiveBonus,
    comboMultiplier,
    ritualMultiplier,
    relicMultiplier,
    finalDamage: Number.isFinite(finalDamage) ? finalDamage : 0,
  }
}

/**
 * 정산 가능 여부 (최소 1장 진실을 열었을 때).
 */
export function canCashOut(consecutiveTruths: number): boolean {
  return consecutiveTruths > 0
}
