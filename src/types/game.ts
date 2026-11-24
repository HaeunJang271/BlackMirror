/** 중앙 판 카드의 앞면 종류 */
export type CardFace = 'truth' | 'curse'

/** 게임 페이즈 (Phase 2: RESOLVING 인터미션 포함) */
export type GamePhase =
  | 'TITLE'
  | 'STAGE_INTRO'
  | 'PLAYER_TURN'
  | 'RESOLVING'
  | 'REWARD'
  | 'VICTORY'
  | 'GAME_OVER'

/** 결과 연출 종류 */
export type ResolveKind = 'cash_out' | 'curse' | 'timeout'

/** RESOLVING 종료 후 이동할 곳 */
export type ResolveNext = 'round' | 'reward' | 'game_over'

/** 인터미션에 보여줄 결과 정보 */
export interface ResolveInfo {
  kind: ResolveKind
  damage: number
  message: string | null
  candlesBefore: number
  candlesAfter: number
  next: ResolveNext
  /** 연출 시간(ms) */
  durationMs: number
  /** 소금의 원이 방어로 깨질 때 */
  saltBreak?: boolean
}

/** 의식 카드 ID */
export type RitualId =
  | 'clairvoyant_coin'
  | 'salt_circle'
  | 'blood_pact'
  | 'swapped_card'
  | 'ash_breath'
  | 'forbidden_hand'

/** 유물 ID */
export type RelicId =
  | 'broken_hand'
  | 'wet_matchbox'
  | 'cracked_mirror'
  | 'crow_feather'
  | 'rusty_weight'
  | 'ashen_seal'

/** 보스(계약자) ID */
export type BossId = 'blind_clockmaker' | 'mirror_priest' | 'scale_master'

/** 중앙 판에 놓인 카드 한 장 */
export interface BoardCard {
  id: string
  face: CardFace
  /** 플레이어에게만 공개된 상태 (투시의 은화) */
  peeked: boolean
  revealed: boolean
  /** 거울 성직자 가짜 암시 — 저주인데 진실처럼 흔들림 */
  fakeHint: boolean
  removed: boolean
}

/** 의식 카드 정의 */
export interface RitualDef {
  id: RitualId
  name: string
  description: string
}

/** 유물 정의 */
export interface RelicDef {
  id: RelicId
  name: string
  description: string
}

/** 보스(계약자) 스펙 */
export interface BossDef {
  id: BossId
  name: string
  maxHp: number
  truthCount: number
  curseCount: number
  introLine: string
  gimmickBadge: string
  gimmickDescription: string
  /** 턴 제한(초). 없으면 무제한 */
  turnTimerSec?: number
  /** 3장째 성공 시 콤보 배수 가산 */
  thirdSuccessMultBonus?: number
  /** 촛불 1개일 때 정산 배수 폭주 */
  lastCandleMult?: number
}

/** 턴 진행 중 누적 상태 */
export interface TurnState {
  consecutiveTruths: number
  baseScore: number
  openedTruthBaseScores: number[]
  ritualsUsedThisTurn: RitualId[]
  saltCircleActive: boolean
  bloodPactActive: boolean
  ashBreathArmed: boolean
  /** 금단의 손으로 복사된 추가 점수 */
  forbiddenHandBonus: number
  /** 첫 패 플립 이후 타이머 가동 */
  timerStarted: boolean
}

/** 보상 선택지 */
export interface RewardOffer {
  relicOptions: RelicId[]
  ritualOptions: RitualId[]
}

/** 전체 게임 상태 */
export interface GameState {
  phase: GamePhase
  stageIndex: number
  bossHp: number
  candles: number
  board: BoardCard[]
  hand: RitualId[]
  relics: RelicId[]
  turn: TurnState
  cursesHitThisRun: number
  ashBreathUsedThisRun: boolean
  /** 재의 숨결 사용 후, 다음 성공 정산까지 유지 */
  ashBreathPending: boolean
  reward: RewardOffer | null
  lastPeekCardId: string | null
  lastDamage: number
  curseFlash: boolean
  resolve: ResolveInfo | null
  round: number
  rngSeed: number
}

/** 리듀서 액션 */
export type GameAction =
  | { type: 'START_RUN' }
  | { type: 'CONFIRM_INTRO' }
  | { type: 'FLIP_CARD'; cardId: string }
  | { type: 'CASH_OUT' }
  | { type: 'USE_RITUAL'; ritualId: RitualId; targetCardId?: string }
  | { type: 'SELECT_REWARD'; relicId: RelicId; ritualId: RitualId }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'FINISH_RESOLVE' }
  | { type: 'CLEAR_CURSE_FLASH' }
  | { type: 'REVIVE_AD' }
  | { type: 'BACK_TO_TITLE' }

/** 데미지 계산 입력 (순수 함수용) */
export interface DamageInput {
  consecutiveTruths: number
  openedTruthBaseScores: number[]
  forbiddenHandBonus: number
  ritualsUsedThisTurn: RitualId[]
  bloodPactActive: boolean
  relics: RelicId[]
  candles: number
  cursesHitThisRun: number
  bossThirdSuccessBonus: number
  bossLastCandleMult: number
  rustyWeightActive: boolean
}

/** 데미지 계산 결과 */
export interface DamageBreakdown {
  baseScore: number
  additiveBonus: number
  comboMultiplier: number
  ritualMultiplier: number
  relicMultiplier: number
  finalDamage: number
}
