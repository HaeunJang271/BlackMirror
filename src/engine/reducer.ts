import { getBoss } from '../data/bosses'
import { ALL_RELIC_IDS } from '../data/relics'
import { ALL_RITUAL_IDS } from '../data/rituals'
import type {
  DamageInput,
  GameAction,
  GameState,
  RelicId,
  RitualId,
} from '../types/game'
import { log } from '../utils/logger'
import { createRng, pickN } from '../utils/rng'
import { buildBoard, removeOneUnopenedCurse } from './board'
import { calculateDamage, canCashOut } from './calculator'
import { applyTruthFlip, createEmptyTurn, markRitualUsed } from './turn'

const MAX_HAND = 4
const MAX_RELICS = 4
const MAX_CANDLES = 3

/**
 * 초기 타이틀 화면 상태를 생성한다.
 */
export function createInitialState(seed = Date.now()): GameState {
  return {
    phase: 'TITLE',
    stageIndex: 0,
    bossHp: getBoss(0).maxHp,
    candles: MAX_CANDLES,
    board: [],
    hand: [],
    relics: [],
    turn: createEmptyTurn(),
    cursesHitThisRun: 0,
    ashBreathUsedThisRun: false,
    reward: null,
    lastPeekCardId: null,
    lastDamage: 0,
    curseFlash: false,
    round: 0,
    rngSeed: seed,
  }
}

/**
 * DamageInput을 현재 상태에서 조립한다.
 */
export function toDamageInput(state: GameState): DamageInput {
  const boss = getBoss(state.stageIndex)
  return {
    consecutiveTruths: state.turn.consecutiveTruths,
    openedTruthBaseScores: state.turn.openedTruthBaseScores,
    forbiddenHandBonus: state.turn.forbiddenHandBonus,
    ritualsUsedThisTurn: state.turn.ritualsUsedThisTurn,
    bloodPactActive: state.turn.bloodPactActive,
    relics: state.relics,
    candles: state.candles,
    cursesHitThisRun: state.cursesHitThisRun,
    bossThirdSuccessBonus: boss.thirdSuccessMultBonus ?? 0,
    bossLastCandleMult: boss.lastCandleMult ?? 1,
    rustyWeightActive: state.relics.includes('rusty_weight'),
  }
}

function drawRitual(hand: RitualId[], seed: number, salt: number): RitualId[] {
  if (hand.length >= MAX_HAND) return hand
  const pool = ALL_RITUAL_IDS.filter((id) => !hand.includes(id))
  if (pool.length === 0) return hand
  const pick = pickN(pool, 1, createRng(seed + salt))[0]
  return pick ? [...hand, pick] : hand
}

function startStage(state: GameState, stageIndex: number): GameState {
  const boss = getBoss(stageIndex)
  const round = 1
  return {
    ...state,
    phase: 'STAGE_INTRO',
    stageIndex,
    bossHp: boss.maxHp,
    board: [],
    turn: createEmptyTurn(),
    reward: null,
    lastDamage: 0,
    curseFlash: false,
    lastPeekCardId: null,
    round,
  }
}

function beginPlayerTurn(state: GameState): GameState {
  const round = state.board.length === 0 ? state.round : state.round + 1
  const board = buildBoard(
    state.stageIndex,
    state.relics,
    state.rngSeed,
    round,
  )
  const hand = drawRitual(state.hand, state.rngSeed, round * 31 + stageSalt(state))
  return {
    ...state,
    phase: 'PLAYER_TURN',
    round,
    board,
    hand,
    turn: createEmptyTurn(),
    lastPeekCardId: null,
    curseFlash: false,
  }
}

function stageSalt(state: GameState): number {
  return state.stageIndex * 97 + state.relics.length * 13
}

function applyCashOut(state: GameState): GameState {
  if (!canCashOut(state.turn.consecutiveTruths)) return state
  const breakdown = calculateDamage(toDamageInput(state))
  let candles = state.candles
  let ashBreathUsedThisRun = state.ashBreathUsedThisRun

  if (state.turn.ashBreathArmed && candles < MAX_CANDLES) {
    candles = Math.min(MAX_CANDLES, candles + 1)
    ashBreathUsedThisRun = true
  }

  const bossHp = Math.max(0, state.bossHp - breakdown.finalDamage)
  log('info', 'cash out', { damage: breakdown.finalDamage, bossHp })

  if (bossHp <= 0) {
    return offerReward({
      ...state,
      bossHp: 0,
      candles,
      ashBreathUsedThisRun,
      lastDamage: breakdown.finalDamage,
      turn: createEmptyTurn(),
    })
  }

  return beginPlayerTurn({
    ...state,
    bossHp,
    candles,
    ashBreathUsedThisRun,
    lastDamage: breakdown.finalDamage,
  })
}

function offerReward(state: GameState): GameState {
  const rand = createRng(state.rngSeed + state.stageIndex * 777)
  const relicPool = ALL_RELIC_IDS.filter((id) => !state.relics.includes(id))
  const ritualPool = ALL_RITUAL_IDS.filter((id) => !state.hand.includes(id))
  return {
    ...state,
    phase: 'REWARD',
    reward: {
      relicOptions: pickN(relicPool, Math.min(1, relicPool.length), rand),
      ritualOptions: pickN(ritualPool, Math.min(2, ritualPool.length), rand),
    },
  }
}

function handleCurse(state: GameState): GameState {
  // 소금의 원: 방어 + 즉시 정산
  if (state.turn.saltCircleActive) {
    log('info', 'salt circle defend + auto cash out')
    return applyCashOut({
      ...state,
      turn: { ...state.turn, saltCircleActive: false },
      curseFlash: true,
    })
  }

  const loss = state.turn.bloodPactActive ? 2 : 1
  const candles = Math.max(0, state.candles - loss)
  const cursesHitThisRun = state.cursesHitThisRun + 1

  if (candles <= 0) {
    return {
      ...state,
      candles: 0,
      cursesHitThisRun,
      curseFlash: true,
      phase: 'GAME_OVER',
      turn: createEmptyTurn(),
    }
  }

  return beginPlayerTurn({
    ...state,
    candles,
    cursesHitThisRun,
    curseFlash: true,
  })
}

function useRitual(
  state: GameState,
  ritualId: RitualId,
  targetCardId?: string,
): GameState {
  if (state.phase !== 'PLAYER_TURN') return state
  if (!state.hand.includes(ritualId)) return state

  const hand = state.hand.filter((id) => id !== ritualId)
  let next: GameState = {
    ...state,
    hand,
    turn: markRitualUsed(state.turn, ritualId),
  }

  switch (ritualId) {
    case 'clairvoyant_coin': {
      const target =
        targetCardId ??
        next.board.find((c) => !c.revealed && !c.removed)?.id
      if (!target) return state
      return {
        ...next,
        board: next.board.map((c) =>
          c.id === target ? { ...c, peeked: true } : c,
        ),
        lastPeekCardId: target,
      }
    }
    case 'salt_circle':
      return {
        ...next,
        turn: { ...next.turn, saltCircleActive: true },
      }
    case 'blood_pact':
      return {
        ...next,
        turn: { ...next.turn, bloodPactActive: true },
      }
    case 'swapped_card':
      return { ...next, board: removeOneUnopenedCurse(next.board) }
    case 'ash_breath':
      if (state.ashBreathUsedThisRun) return state
      return {
        ...next,
        turn: { ...next.turn, ashBreathArmed: true },
      }
    case 'forbidden_hand': {
      const scores = next.turn.openedTruthBaseScores
      if (scores.length === 0) return state
      const copy = scores[scores.length - 1]!
      return {
        ...next,
        turn: {
          ...next.turn,
          forbiddenHandBonus: next.turn.forbiddenHandBonus + copy,
          baseScore: next.turn.baseScore + copy,
        },
      }
    }
    default:
      return state
  }
}

/**
 * 게임 순수 리듀서. UI 부작용 없이 상태만 전이한다.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_RUN':
      return startStage(
        { ...createInitialState(state.rngSeed || Date.now()), hand: pickN(ALL_RITUAL_IDS, 2, createRng(state.rngSeed || Date.now())) },
        0,
      )
    case 'CONFIRM_INTRO':
      if (state.phase !== 'STAGE_INTRO') return state
      return beginPlayerTurn(state)
    case 'FLIP_CARD': {
      if (state.phase !== 'PLAYER_TURN') return state
      const card = state.board.find((c) => c.id === action.cardId)
      if (!card || card.revealed || card.removed) return state
      const board = state.board.map((c) =>
        c.id === action.cardId ? { ...c, revealed: true } : c,
      )
      if (card.face === 'curse') {
        return handleCurse({ ...state, board })
      }
      return { ...state, board, turn: applyTruthFlip(state.turn) }
    }
    case 'CASH_OUT':
      if (state.phase !== 'PLAYER_TURN') return state
      return applyCashOut(state)
    case 'USE_RITUAL':
      return useRitual(state, action.ritualId, action.targetCardId)
    case 'SELECT_REWARD': {
      if (state.phase !== 'REWARD' || !state.reward) return state
      const relics = [...state.relics]
      if (relics.length < MAX_RELICS && !relics.includes(action.relicId)) {
        relics.push(action.relicId)
      }
      const hand = [...state.hand]
      if (hand.length < MAX_HAND && !hand.includes(action.ritualId)) {
        hand.push(action.ritualId)
      }
      const nextStage = state.stageIndex + 1
      if (nextStage >= 3) {
        return { ...state, relics, hand, phase: 'VICTORY', reward: null }
      }
      return startStage({ ...state, relics, hand, reward: null }, nextStage)
    }
    case 'CLEAR_CURSE_FLASH':
      return { ...state, curseFlash: false }
    case 'REVIVE_AD':
      if (state.phase !== 'GAME_OVER') return state
      return beginPlayerTurn({ ...state, candles: 1, phase: 'PLAYER_TURN' })
    case 'BACK_TO_TITLE':
      return createInitialState(state.rngSeed + 1)
    case 'TICK_TIMER':
      // Phase 1: 타이머 만료는 UI에서 CASH_OUT/강제 종료로 연결
      return state
    default:
      return state
  }
}

/** 보상 유물 단일 선택 헬퍼 (옵션이 1개일 때) */
export function defaultRelicPick(options: RelicId[]): RelicId | null {
  return options[0] ?? null
}
