import { BOSSES, getBoss } from '../data/bosses'
import { ALL_RELIC_IDS } from '../data/relics'
import { ALL_RITUAL_IDS } from '../data/rituals'
import type {
  DamageInput,
  GameAction,
  GameState,
  RelicId,
  ResolveInfo,
  RitualId,
} from '../types/game'
import { log } from '../utils/logger'
import { createRng, pickN } from '../utils/rng'
import { buildBoard, removeOneUnopenedCurse } from './board'
import { calculateDamage, canCashOut } from './calculator'
import { MAX_CANDLES, MAX_HAND, MAX_RELICS } from './constants'
import { applyTruthFlip, createEmptyTurn, markRitualUsed } from './turn'

export { MAX_CANDLES } from './constants'
const CASH_RESOLVE_MS = 650
const FAIL_RESOLVE_MS = 850

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
    spentRituals: [],
    relics: [],
    turn: createEmptyTurn(),
    cursesHitThisRun: 0,
    ashBreathUsedThisRun: false,
    ashBreathPending: false,
    reward: null,
    lastPeekCardId: null,
    lastDamage: 0,
    curseFlash: false,
    resolve: null,
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

function startStage(state: GameState, stageIndex: number): GameState {
  const boss = getBoss(stageIndex)
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
    resolve: null,
    lastPeekCardId: null,
    round: 1,
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
  const pool = ALL_RITUAL_IDS.filter(
    (id) => !state.hand.includes(id) && !(id === 'ash_breath' && state.ashBreathUsedThisRun),
  )
  const seed = state.rngSeed + round * 31 + state.stageIndex * 97 + state.relics.length * 13
  const drawn = state.hand.length < MAX_HAND ? pickN(pool, 1, createRng(seed)) : []
  return {
    ...state,
    phase: 'PLAYER_TURN',
    round,
    board,
    hand: [...state.hand, ...drawn],
    spentRituals: state.spentRituals.filter((id) => !drawn.includes(id)),
    turn: createEmptyTurn(),
    lastPeekCardId: null,
    curseFlash: false,
    resolve: null,
  }
}

function offerReward(state: GameState): GameState {
  const rand = createRng(state.rngSeed + state.stageIndex * 777)
  const relicPool = ALL_RELIC_IDS.filter((id) => !state.relics.includes(id))
  return {
    ...state,
    phase: 'REWARD',
    resolve: null,
    reward: {
      relicOptions: pickN(relicPool, 3, rand),
    },
  }
}

function enterResolve(
  state: GameState,
  patch: Partial<GameState>,
  info: ResolveInfo,
): GameState {
  return {
    ...state,
    ...patch,
    phase: 'RESOLVING',
    resolve: info,
    turn: createEmptyTurn(),
  }
}

function applyCashOut(
  state: GameState,
  options: { saltBreak?: boolean } = {},
): GameState {
  if (!canCashOut(state.turn.consecutiveTruths)) return state
  const breakdown = calculateDamage(toDamageInput(state))
  let candles = state.candles
  let ashBreathUsedThisRun = state.ashBreathUsedThisRun
  let ashBreathPending = state.ashBreathPending || state.turn.ashBreathArmed

  // 정산 성공 시에만 재점화. 촛불이 이미 풀이면 pending 유지.
  if (ashBreathPending && candles < MAX_CANDLES) {
    candles = Math.min(MAX_CANDLES, candles + 1)
    ashBreathUsedThisRun = true
    ashBreathPending = false
    log('info', 'ash breath relight on cash out', { candles })
  }

  const bossHp = Math.max(0, state.bossHp - breakdown.finalDamage)
  log('info', 'cash out', { damage: breakdown.finalDamage, bossHp })

  const next = bossHp <= 0 ? 'reward' : 'round'
  return enterResolve(
    state,
    {
      bossHp,
      candles,
      ashBreathUsedThisRun,
      ashBreathPending,
      lastDamage: breakdown.finalDamage,
      curseFlash: false,
    },
    {
      kind: 'cash_out',
      damage: breakdown.finalDamage,
      message: null,
      candlesBefore: state.candles,
      candlesAfter: candles,
      next,
      durationMs: CASH_RESOLVE_MS,
      saltBreak: options.saltBreak,
    },
  )
}

function handleCurse(state: GameState): GameState {
  if (state.turn.saltCircleActive) {
    log('info', 'salt circle defend + auto cash out')
    return applyCashOut(
      {
        ...state,
        turn: { ...state.turn, saltCircleActive: false },
        curseFlash: true,
      },
      { saltBreak: true },
    )
  }

  const loss = state.turn.bloodPactActive ? 2 : 1
  const candlesAfter = Math.max(0, state.candles - loss)
  const cursesHitThisRun = state.cursesHitThisRun + 1
  const next = candlesAfter <= 0 ? 'game_over' : 'round'

  return enterResolve(
    state,
    {
      candles: candlesAfter,
      cursesHitThisRun,
      curseFlash: true,
      lastDamage: 0,
    },
    {
      kind: 'curse',
      damage: 0,
      message: '저주에 걸렸다',
      candlesBefore: state.candles,
      candlesAfter,
      next,
      durationMs: FAIL_RESOLVE_MS,
    },
  )
}

function handleTimeout(state: GameState): GameState {
  if (canCashOut(state.turn.consecutiveTruths)) {
    return applyCashOut(state)
  }
  const candlesAfter = Math.max(0, state.candles - 1)
  const next = candlesAfter <= 0 ? 'game_over' : 'round'
  return enterResolve(
    state,
    {
      candles: candlesAfter,
      curseFlash: true,
      lastDamage: 0,
    },
    {
      kind: 'timeout',
      damage: 0,
      message: '시간이 다 됐다',
      candlesBefore: state.candles,
      candlesAfter,
      next,
      durationMs: FAIL_RESOLVE_MS,
    },
  )
}

function finishResolve(state: GameState): GameState {
  if (state.phase !== 'RESOLVING' || !state.resolve) return state
  const { next } = state.resolve
  if (next === 'reward') {
    if (state.stageIndex === BOSSES.length - 1) {
      return { ...state, phase: 'VICTORY', resolve: null, reward: null, curseFlash: false }
    }
    return offerReward({ ...state, resolve: null, curseFlash: false })
  }
  if (next === 'game_over') {
    return {
      ...state,
      phase: 'GAME_OVER',
      resolve: null,
      curseFlash: false,
      turn: createEmptyTurn(),
    }
  }
  return beginPlayerTurn({ ...state, curseFlash: false })
}

function applyRitual(
  state: GameState,
  ritualId: RitualId,
  targetCardId?: string,
): GameState {
  if (state.phase !== 'PLAYER_TURN') return state
  if (!state.hand.includes(ritualId)) return state

  const hand = state.hand.filter((id) => id !== ritualId)
  const next: GameState = {
    ...state,
    hand,
    spentRituals: [...state.spentRituals, ritualId],
    turn: { ...markRitualUsed(state.turn, ritualId), timerStarted: true },
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
      return { ...next, turn: { ...next.turn, saltCircleActive: true } }
    case 'blood_pact':
      return { ...next, turn: { ...next.turn, bloodPactActive: true } }
    case 'swapped_card':
      return { ...next, board: removeOneUnopenedCurse(next.board) }
    case 'ash_breath': {
      if (state.ashBreathUsedThisRun || state.ashBreathPending || state.candles >= MAX_CANDLES) return state
      const candles = state.candles + 1
      log('info', 'ash breath immediate relight', { from: state.candles, to: candles })
      return {
        ...next,
        candles,
        ashBreathUsedThisRun: true,
        ashBreathPending: false,
        turn: { ...next.turn, ashBreathArmed: false },
      }
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
        {
          ...createInitialState(state.rngSeed || Date.now()),
          hand: pickN(
            ALL_RITUAL_IDS,
            2,
            createRng(state.rngSeed || Date.now()),
          ),
        },
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
      const withTimer: GameState = {
        ...state,
        board,
        turn: { ...state.turn, timerStarted: true },
      }
      if (card.face === 'curse') return handleCurse(withTimer)
      return {
        ...withTimer,
        turn: applyTruthFlip({ ...state.turn, timerStarted: true }),
      }
    }
    case 'CASH_OUT':
      if (state.phase !== 'PLAYER_TURN') return state
      return applyCashOut(state)
    case 'USE_RITUAL':
      return applyRitual(state, action.ritualId, action.targetCardId)
    case 'SELECT_REWARD': {
      if (state.phase !== 'REWARD' || !state.reward || !state.reward.relicOptions.includes(action.relicId) || !['rituals', 'candle'].includes(action.choice)) return state
      const relics = [...state.relics]
      if (relics.length < MAX_RELICS && !relics.includes(action.relicId)) {
        relics.push(action.relicId)
      }
      const pool = state.spentRituals.filter((id) => !state.hand.includes(id) && !(id === 'ash_breath' && state.ashBreathUsedThisRun))
      const refill = action.choice === 'rituals' ? pickN(pool, Math.min(2, MAX_HAND - state.hand.length), createRng(state.rngSeed + state.stageIndex * 777 + 1)) : []
      const hand = [...state.hand, ...refill]
      const spentRituals = state.spentRituals.filter((id) => !refill.includes(id))
      const candles = action.choice === 'candle' ? Math.min(MAX_CANDLES, state.candles + 1) : state.candles
      const nextStage = state.stageIndex + 1
      if (nextStage >= 3) {
        return { ...state, relics, hand, spentRituals, candles, phase: 'VICTORY', reward: null }
      }
      return startStage({ ...state, relics, hand, spentRituals, candles, reward: null }, nextStage)
    }
    case 'CLEAR_CURSE_FLASH':
      return { ...state, curseFlash: false }
    case 'REVIVE_AD':
      if (state.phase !== 'GAME_OVER') return state
      return beginPlayerTurn({ ...state, candles: 1, phase: 'PLAYER_TURN' })
    case 'BACK_TO_TITLE':
      return createInitialState(state.rngSeed + 1)
    case 'TIMER_EXPIRED':
      if (state.phase !== 'PLAYER_TURN') return state
      return handleTimeout(state)
    case 'FINISH_RESOLVE':
      return finishResolve(state)
    default:
      return state
  }
}

/** 보상 유물 단일 선택 헬퍼 (옵션이 1개일 때) */
export function defaultRelicPick(options: RelicId[]): RelicId | null {
  return options[0] ?? null
}
