import { useEffect, useReducer, useRef, useState } from 'react'
import { FilmGrain } from './components/FilmGrain'
import { GameHud } from './components/GameHud'
import { OverlayScreens } from './components/OverlayScreens'
import { ResolveOverlay } from './components/ResolveOverlay'
import { RewardModal } from './components/RewardModal'
import { TableScene } from './components/TableScene'
import { getBoss } from './data/bosses'
import { MAX_HAND } from './engine/constants'
import { Volume2, VolumeX } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { calculateDamage, canCashOut } from './engine/calculator'
import {
  createInitialState,
  gameReducer,
  MAX_CANDLES,
  toDamageInput,
} from './engine/reducer'
import type { RitualFxCue } from './scene/ritualFx'
import type { RitualId } from './types/game'
import { log } from './utils/logger'
import { getBossLine, getBossReaction } from './utils/bossDialogue'
import { preloadRewardedAd, showRewardedAd } from './utils/rewardedAd'
import {
  playCandleBlowOut,
  playCandleLit,
  playCardFlip,
  playBossDefeat,
  playCashOut,
  playCurseHit,
  playCurseShatter,
  playTimerTick,
  playTruthReveal,
  isMuted,
  toggleMute,
  unlockAudio,
} from './utils/sound'

const OPENING_KEY = 'blackscale_opening_done'
const TUTORIAL_KEY = 'blackscale_tutorial_done'
const openingLines = ['00:00. 문이 잠겼다.', '나가려면 저울 앞에 앉은 세 망자의 봉인을 깨야 한다.', '촛불 세 자루가 다 꺼지기 전에.']
const stageLines = ['첫 번째 계약자. 멈춘 시간을 지키는 자.', '두 번째 계약자. 거짓만 비추는 자.', '마지막 계약자. 이 방의 규칙 그 자체.']
const readFlag = (key: string) => { try { return localStorage.getItem(key) !== null } catch { return false } }
const writeFlag = (key: string) => { try { localStorage.setItem(key, '1') } catch { /* Storage may be unavailable. */ } }

const IS_ONESTORE = import.meta.env.VITE_PLATFORM === 'onestore'

/**
 * 《검은 저울》 Phase 3: 1인칭 3D 테이블 + 의식 FX + 모바일 카메라.
 */
export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(20261125),
  )
  const adRequest = useRef<AbortController | null>(null)
  const prevPhase = useRef(state.phase)
  const prevTruths = useRef(0)
  const lastTickSec = useRef<number | null>(null)
  const turnClock = useRef({ stage: -1, round: -1, remainingMs: 0 })
  const ritualKey = useRef(0)
  const dialogueTimer = useRef<number | null>(null)

  const [opening, setOpening] = useState<number | null>(null)
  const [stageBanner, setStageBanner] = useState<number | null>(null)
  const [tutorial, setTutorial] = useState<'first' | 'truth' | 'waiting' | 'ritual' | 'continue' | 'done'>(() => readFlag(TUTORIAL_KEY) ? 'done' : 'first')
  const tutorialRound = useRef<number | null>(null)

  const [hitFx, setHitFx] = useState(false)
  const [nodFx, setNodFx] = useState(false)
  const [saltBreak, setSaltBreak] = useState(false)
  const [ritualCue, setRitualCue] = useState<RitualFxCue | null>(null)
  const [bloodPulse, setBloodPulse] = useState(0)
  const [timerSec, setTimerSec] = useState<number | null>(null)
  const [muted, setMuted] = useState(isMuted)
  const [reaction, setReaction] = useState<{ bossId: string; line: string } | null>(null)
  const [adBusy, setAdBusy] = useState(false)
  const [adStatus, setAdStatus] = useState<'loading' | 'simulation' | 'showing'>('loading')
  const [adError, setAdError] = useState<string | null>(null)
  const [exitDialog, setExitDialog] = useState(false)

  const boss = getBoss(Math.min(state.stageIndex, 2))
  const breakdown = calculateDamage(toDamageInput(state))
  const playing = state.phase === 'PLAYER_TURN'
  const resolving = state.phase === 'RESOLVING'

  const finishOpening = () => {
    writeFlag(OPENING_KEY)
    setOpening(null)
    dispatch({ type: 'START_RUN' })
  }

  useEffect(() => {
    if (opening === null) return
    const id = window.setTimeout(() => {
      if (opening === openingLines.length - 1) finishOpening()
      else setOpening(opening + 1)
    }, 2400)
    return () => window.clearTimeout(id)
  }, [opening])

  useEffect(() => {
    if (state.phase !== 'STAGE_INTRO') return
    setStageBanner(state.stageIndex)
    dispatch({ type: 'CONFIRM_INTRO' })
    const id = window.setTimeout(() => setStageBanner(null), 1500)
    return () => window.clearTimeout(id)
  }, [state.phase, state.stageIndex])

  useEffect(() => {
    if (stageBanner === null) return
    const id = window.setTimeout(() => setStageBanner(null), 1500)
    return () => window.clearTimeout(id)
  }, [stageBanner])

  useEffect(() => {
    if (tutorial !== 'done' && state.stageIndex === 0 && state.phase === 'REWARD') {
      writeFlag(TUTORIAL_KEY)
      setTutorial('done')
    } else if (tutorial === 'waiting' && state.stageIndex === 0 && playing && tutorialRound.current !== null && state.round > tutorialRound.current) {
      tutorialRound.current = state.round
      setTutorial(state.hand.length > 0 ? 'ritual' : 'continue')
    } else if (tutorial === 'ritual' && (state.stageIndex !== 0 || (state.phase !== 'PLAYER_TURN' && state.phase !== 'STAGE_INTRO'))) {
      setTutorial('continue')
    }
  }, [tutorial, state.stageIndex, state.phase, state.round, state.hand.length, playing])

  useEffect(() => {
    void unlockAudio()
    if (!IS_ONESTORE) void preloadRewardedAd()
    return () => { adRequest.current?.abort() }
  }, [])

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    const listener = CapacitorApp.addListener('backButton', () => setExitDialog(true))
      .catch((error: unknown) => { log('warn', 'back button listener failed', error); return null })
    return () => {
      void listener.then((handle) => handle?.remove())
    }
  }, [])

  const reviveWithAd = async () => {
    if (adRequest.current || state.phase !== 'GAME_OVER' || state.hasUsedRevive) return
    if (IS_ONESTORE) {
      dispatch({ type: 'REVIVE_AD' })
      void playCandleLit()
      return
    }
    const controller = new AbortController()
    adRequest.current = controller
    setAdError(null)
    setAdBusy(true)
    let rewarded = false
    try {
      const result = await showRewardedAd({
        signal: controller.signal,
        onStatus: setAdStatus,
        onReward: () => {
          if (controller.signal.aborted || rewarded) return
          rewarded = true
          dispatch({ type: 'REVIVE_AD' })
        },
      })
      if (controller.signal.aborted) return
      if (result === 'rewarded' && rewarded) void playCandleLit()
      else if (result === 'failed') setAdError('광고를 불러오지 못했어요. 다시 시도해 주세요.')
    } finally {
      if (adRequest.current === controller) adRequest.current = null
      if (!controller.signal.aborted) setAdBusy(false)
    }
  }

  useEffect(() => {
    if (!state.resolve) return
    const line = getBossReaction(boss, state.resolve)
    if (!line) return
    if (dialogueTimer.current !== null) window.clearTimeout(dialogueTimer.current)
    setReaction({ bossId: boss.id, line })
    dialogueTimer.current = window.setTimeout(() => setReaction(null), 3500)
  }, [state.resolve, boss])

  useEffect(() => () => {
    if (dialogueTimer.current !== null) window.clearTimeout(dialogueTimer.current)
  }, [])

  const bossLine = getBossLine(boss, state.bossHp, state.candles, reaction?.bossId === boss.id ? reaction.line : null)

  useEffect(() => {
    const limit = boss.turnTimerSec
    if (!playing || !limit || (tutorial !== 'done' && state.stageIndex === 0)) {
      if (state.phase === 'TITLE' || state.phase === 'STAGE_INTRO') turnClock.current.stage = -1
      setTimerSec(null)
      lastTickSec.current = null
      return
    }
    if (turnClock.current.stage !== state.stageIndex || turnClock.current.round !== state.round) {
      turnClock.current = { stage: state.stageIndex, round: state.round, remainingMs: limit * 1000 }
      lastTickSec.current = null
    }
    const remaining = turnClock.current.remainingMs
    setTimerSec(Math.ceil(remaining / 1000))
    if (!state.turn.timerStarted || exitDialog || adBusy) return
    const startedAt = Date.now()
    const tick = window.setInterval(() => {
      const left = Math.ceil(Math.max(0, remaining - (Date.now() - startedAt)) / 1000)
      setTimerSec(left)
      if (left <= 4 && left > 0 && lastTickSec.current !== left) {
        lastTickSec.current = left
        void playTimerTick()
      }
      if (left <= 0) {
        window.clearInterval(tick)
        log('info', 'turn timer expired')
        dispatch({ type: 'TIMER_EXPIRED' })
      }
    }, 200)
    return () => {
      window.clearInterval(tick)
      turnClock.current.remainingMs = Math.max(0, remaining - (Date.now() - startedAt))
    }
  }, [playing, boss.turnTimerSec, state.phase, state.stageIndex, state.round, state.turn.timerStarted, exitDialog, adBusy, tutorial])

  useEffect(() => {
    if (!resolving || !state.resolve) return
    const id = window.setTimeout(() => {
      dispatch({ type: 'FINISH_RESOLVE' })
    }, state.resolve.durationMs)
    return () => window.clearTimeout(id)
  }, [resolving, state.resolve])

  useEffect(() => {
    if (state.phase === 'RESOLVING' && prevPhase.current !== 'RESOLVING') {
      if (state.resolve?.kind === 'curse' || state.resolve?.saltBreak) void playCurseShatter()
      if (state.resolve?.kind === 'cash_out') {
        void playCashOut()
        if (state.resolve.next === 'reward') void playBossDefeat()
        setHitFx(true)
        window.setTimeout(() => setHitFx(false), 100)
        if (state.resolve.saltBreak) {
          setSaltBreak(true)
          window.setTimeout(() => setSaltBreak(false), 120)
        }
      } else {
        if (state.resolve?.kind === 'curse') {
          void playCandleBlowOut(0.25)
        } else {
          void playCurseHit()
          void playCandleBlowOut()
        }
        setNodFx(true)
        window.setTimeout(() => setNodFx(false), 100)
      }
    }
    prevPhase.current = state.phase
  }, [state.phase, state.resolve])

  useEffect(() => {
    if (
      playing &&
      state.turn.consecutiveTruths > prevTruths.current &&
      state.turn.consecutiveTruths > 0
    ) {
      void playTruthReveal(state.turn.consecutiveTruths)
    }
    prevTruths.current = state.turn.consecutiveTruths
  }, [playing, state.turn.consecutiveTruths])

  useEffect(() => {
    if (!state.curseFlash) return
    const id = window.setTimeout(
      () => dispatch({ type: 'CLEAR_CURSE_FLASH' }),
      420,
    )
    return () => window.clearTimeout(id)
  }, [state.curseFlash])

  const fireRitual = (ritualId: RitualId, targetCardId?: string) => {
    ritualKey.current += 1
    const cue: RitualFxCue = {
      ritualId,
      targetCardId,
      key: ritualKey.current,
    }
    // 금단의 손: 마지막 연 진실 카드
    if (ritualId === 'forbidden_hand') {
      const opened = [...state.board]
        .reverse()
        .find((c) => c.revealed && c.face === 'truth' && !c.removed)
      cue.targetCardId = opened?.id
    }
    setRitualCue(cue)
    window.setTimeout(() => setRitualCue(null), 700)
  }

  const displayMult =
    breakdown.comboMultiplier *
    breakdown.ritualMultiplier *
    breakdown.relicMultiplier
  const inputLocked = !playing || adBusy || exitDialog || stageBanner !== null
  const showHud =
    state.phase === 'PLAYER_TURN' ||
    state.phase === 'RESOLVING' ||
    state.phase === 'REWARD'

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-[#050404]">
      <TableScene
        board={state.board}
        candles={state.candles}
        bossId={boss.id}
        expectedDamage={playing ? breakdown.finalDamage : state.lastDamage}
        multiplier={playing ? displayMult : Math.max(1, displayMult)}
        interactive={playing && !adBusy && !exitDialog && stageBanner === null}
        hit={hitFx}
        nod={nodFx}
        saltActive={state.turn.saltCircleActive}
        bloodActive={state.turn.bloodPactActive}
        saltBreak={saltBreak}
        ritualCue={ritualCue}
        onBloodPulse={setBloodPulse}
        onCardClick={(cardId) => {
          void unlockAudio()
          void playCardFlip()
          const next = gameReducer(state, { type: 'FLIP_CARD', cardId })
          if (tutorial === 'first' && next !== state) setTutorial('truth')
          dispatch({ type: 'FLIP_CARD', cardId })
        }}
      />

      <FilmGrain />

      <button type="button" aria-label={muted ? '소리 켜기' : '음소거'} aria-pressed={muted}
        onClick={() => { setMuted(toggleMute()); void unlockAudio() }}
        style={{ top: 'calc(0.25rem + env(safe-area-inset-top))', right: 'calc(1rem + env(safe-area-inset-right))' }}
        className="absolute right-4 top-1 z-50 rounded-sm bg-black/60 p-2 text-brass">
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* 피의 서약 화면 테두리 맥동 */}
      {bloodPulse > 0.05 && (
        <div
          className="pointer-events-none absolute inset-0 z-[15]"
          style={{
            boxShadow: `inset 0 0 ${40 + bloodPulse * 50}px rgba(139,30,30,${0.25 + bloodPulse * 0.35})`,
          }}
        />
      )}

      {showHud && (
        <GameHud
          tutorialHint={playing && state.stageIndex === 0 ? (tutorial === 'first' ? 'first' : tutorial === 'truth' ? (state.turn.consecutiveTruths > 0 ? 'truth' : 'retry') : tutorial === 'ritual' ? 'ritual' : tutorial === 'continue' ? (state.turn.consecutiveTruths > 0 ? 'truth' : 'next') : null) : null}
          boss={boss}
          bossLine={bossLine}
          bossHp={state.bossHp}
          stageIndex={state.stageIndex}
          board={state.board}
          timerSec={playing && boss.turnTimerSec && !(tutorial !== 'done' && state.stageIndex === 0) ? timerSec : null}
          expectedDamage={playing ? breakdown.finalDamage : state.lastDamage}
          multiplier={playing ? displayMult : Math.max(1, displayMult)}
          canCashOut={playing && canCashOut(state.turn.consecutiveTruths)}
          hand={state.hand}
          ashBreathAvailable={state.candles < MAX_CANDLES && !state.ashBreathUsedThisRun && !state.ashBreathPending}
          relics={state.relics}
          inputLocked={inputLocked}
          onCashOut={() => {
            void unlockAudio()
            if (tutorial === 'truth' && gameReducer(state, { type: 'CASH_OUT' }) !== state) {
              tutorialRound.current = state.round
              setTutorial('waiting')
            }
            dispatch({ type: 'CASH_OUT' })
          }}
          onUseRitual={(ritualId) => {
            void unlockAudio()
            const needsTarget = ritualId === 'clairvoyant_coin'
            const target = state.board.find((c) => !c.revealed && !c.removed)
            const targetCardId = needsTarget ? target?.id : undefined
            const action = { type: 'USE_RITUAL' as const, ritualId, targetCardId }
            if (gameReducer(state, action) === state) return
            if (tutorial === 'ritual') setTutorial('continue')
            fireRitual(ritualId, targetCardId)
            dispatch(action)
          }}
        />
      )}

      {resolving && state.resolve && <ResolveOverlay info={state.resolve} />}

      {state.phase !== 'STAGE_INTRO' && <OverlayScreens
        phase={state.phase}
        boss={boss}
        onEnableAudio={() => { void unlockAudio() }}
        onPlayMusic={() => {
          if (muted) setMuted(toggleMute())
          void unlockAudio()
        }}
        onStart={() => {
          void unlockAudio()
          if (tutorial !== 'done') { setTutorial('first'); tutorialRound.current = null }
          if (readFlag(OPENING_KEY)) dispatch({ type: 'START_RUN' })
          else setOpening(0)
        }}
        onConfirmIntro={() => dispatch({ type: 'CONFIRM_INTRO' })}
        onRetry={() => {
          dispatch({ type: 'BACK_TO_TITLE' })
        }}
        onRevive={() => { void unlockAudio(); void reviveWithAd() }}
        hasUsedRevive={state.hasUsedRevive}
        adBusy={adBusy}
        adError={adError}
        freeRevive={IS_ONESTORE}
      />}

      {stageBanner !== null && opening === null && (
        <div className="pointer-events-none absolute inset-x-0 top-[20%] z-40 flex justify-center px-4" role="status">
          <div className="stage-story bg-black/85 px-6 py-4 text-center font-[family-name:var(--font-display)] text-ink">
            <p className="mb-1 text-sm text-brass">{getBoss(stageBanner).name}</p>
            <p>{stageLines[stageBanner]}</p>
          </div>
        </div>
      )}
      {opening !== null && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black px-6 text-center">
          <p key={opening} className="opening-line font-[family-name:var(--font-display)] text-lg text-ink sm:text-2xl">{openingLines[opening]}</p>
          <button type="button" onClick={finishOpening} aria-label="인트로 건너뛰기" className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] p-2 text-xs tracking-widest text-ink-muted">SKIP</button>
        </div>
      )}

      {adBusy && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 px-6" role="status" aria-live="polite">
          <p className="rounded-sm border border-brass/40 bg-desk-lift px-6 py-5 text-center text-sm text-brass">
            {adStatus === 'simulation' ? '광고 테스트 시뮬레이션 중...' : adStatus === 'showing' ? '광고 시청 중...' : '광고를 불러오는 중...'}
          </p>
        </div>
      )}

      {exitDialog && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/85 px-6" role="dialog" aria-modal="true" aria-labelledby="exit-title">
          <div className="w-full max-w-sm rounded-sm border border-brass/40 bg-desk-lift p-5 text-center">
            <p id="exit-title" className="text-sm text-ink">0시의 소환실을 나가시겠습니까?</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setExitDialog(false)} className="rounded-sm border border-brass/40 py-3 text-sm text-ink">계속하기</button>
              <button type="button" onClick={() => { void CapacitorApp.exitApp() }} className="rounded-sm border border-curse/60 py-3 text-sm text-curse-glow">나가기</button>
            </div>
          </div>
        </div>
      )}

      {state.phase === 'REWARD' && state.reward && (
        <RewardModal
          offer={state.reward}
          defeatLine={boss.defeatLine}
          refillCount={Math.min(2, MAX_HAND - state.hand.length, state.spentRituals.filter((id) => !state.hand.includes(id) && !(id === 'ash_breath' && state.ashBreathUsedThisRun)).length)}
          canRelight={state.candles < MAX_CANDLES}
          onConfirm={(relicId, choice) =>
            dispatch({ type: 'SELECT_REWARD', relicId, choice })
          }
        />
      )}
    </div>
  )
}
