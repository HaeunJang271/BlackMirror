import type { RitualId, TurnState } from '../types/game'
import { getCardBaseScore } from './calculator'

/** 빈 턴 상태 */
export function createEmptyTurn(): TurnState {
  return {
    consecutiveTruths: 0,
    baseScore: 0,
    openedTruthBaseScores: [],
    ritualsUsedThisTurn: [],
    saltCircleActive: false,
    bloodPactActive: false,
    ashBreathArmed: false,
    forbiddenHandBonus: 0,
    timerStarted: false,
  }
}

/**
 * 진실 카드를 열었을 때 턴 점수를 갱신한다.
 */
export function applyTruthFlip(turn: TurnState): TurnState {
  const nextCount = turn.consecutiveTruths + 1
  const cardScore = getCardBaseScore(nextCount)
  const opened = [...turn.openedTruthBaseScores, cardScore]
  return {
    ...turn,
    consecutiveTruths: nextCount,
    openedTruthBaseScores: opened,
    baseScore: opened.reduce((a, b) => a + b, 0),
  }
}

/**
 * 의식 카드 사용을 턴 상태에 기록한다.
 */
export function markRitualUsed(turn: TurnState, ritualId: RitualId): TurnState {
  return {
    ...turn,
    ritualsUsedThisTurn: [...turn.ritualsUsedThisTurn, ritualId],
  }
}
