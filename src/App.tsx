import { useEffect, useReducer, useRef, useState } from 'react'
import { FilmGrain } from './components/FilmGrain'
import { GameHud } from './components/GameHud'
import { MuteButton } from './components/MuteButton'
import { OverlayScreens } from './components/OverlayScreens'
import { ResolveOverlay } from './components/ResolveOverlay'
import { RewardModal } from './components/RewardModal'
import { TableScene } from './components/TableScene'
import { getBoss } from './data/bosses'
import { calculateDamage, canCashOut } from './engine/calculator'
import {
  createInitialState,
  gameReducer,
  toDamageInput,
} from './engine/reducer'
import type { RitualFxCue } from './scene/ritualFx'
import type { RitualId } from './types/game'
import { log } from './utils/logger'
import {
  playCardFlip,
  playCashOut,
  playCurseHit,
  playTick,
  playTruthChime,
  unlockAudio,
} from './utils/sound'

/**
 * 《검은 저울》 Phase 3: 1인칭 3D 테이블 + 의식 FX + 모바일 카메라.
 */
export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(20261125),
  )
  const revivedRef = useRef(false)
  const prevPhase = useRef(state.phase)
  const prevTruths = useRef(0)
  const lastTickSec = useRef<number | null>(null)
  const ritualKey = useRef(0)

  const [hitFx, setHitFx] = useState(false)
  const [nodFx, setNodFx] = useState(false)
  const [saltBreak, setSaltBreak] = useState(false)
  const [ritualCue, setRitualCue] = useState<RitualFxCue | null>(null)
  const [bloodPulse, setBloodPulse] = useState(0)
  const [timerSec, setTimerSec] = useState<number | null>(null)

  const boss = getBoss(Math.min(state.stageIndex, 2))
  const breakdown = calculateDamage(toDamageInput(state))
  const playing = state.phase === 'PLAYER_TURN'
  const resolving = state.phase === 'RESOLVING'

  useEffect(() => {
    const shouldRun =
      playing && Boolean(boss.turnTimerSec) && state.turn.timerStarted
    if (!shouldRun) {
      setTimerSec(boss.turnTimerSec && playing ? boss.turnTimerSec : null)
      lastTickSec.current = null
      return
    }
    const limit = boss.turnTimerSec!
    setTimerSec(limit)
    const startedAt = Date.now()
    const tick = window.setInterval(() => {
      const left = Math.max(
        0,
        limit - Math.floor((Date.now() - startedAt) / 1000),
      )
      setTimerSec(left)
      if (left <= 3 && left > 0 && lastTickSec.current !== left) {
        lastTickSec.current = left
        void playTick()
      }
      if (left <= 0) {
        window.clearInterval(tick)
        log('info', 'turn timer expired')
        dispatch({ type: 'TIMER_EXPIRED' })
      }
    }, 200)
    return () => window.clearInterval(tick)
  }, [playing, boss.turnTimerSec, state.round, state.turn.timerStarted])

  useEffect(() => {
    if (!resolving || !state.resolve) return
    const id = window.setTimeout(() => {
      dispatch({ type: 'FINISH_RESOLVE' })
    }, state.resolve.durationMs)
    return () => window.clearTimeout(id)
  }, [resolving, state.resolve])

  useEffect(() => {
    if (state.phase === 'RESOLVING' && prevPhase.current !== 'RESOLVING') {
      if (state.resolve?.kind === 'cash_out') {
        void playCashOut()
        setHitFx(true)
        window.setTimeout(() => setHitFx(false), 100)
        if (state.resolve.saltBreak) {
          setSaltBreak(true)
          window.setTimeout(() => setSaltBreak(false), 120)
        }
      } else {
        void playCurseHit()
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
      void playTruthChime(state.turn.consecutiveTruths)
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
  const inputLocked = !playing
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
        interactive={playing}
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
          dispatch({ type: 'FLIP_CARD', cardId })
        }}
      />

      <FilmGrain />

      {/* 피의 서약 화면 테두리 맥동 */}
      {bloodPulse > 0.05 && (
        <div
          className="pointer-events-none absolute inset-0 z-[15]"
          style={{
            boxShadow: `inset 0 0 ${40 + bloodPulse * 50}px rgba(139,30,30,${0.25 + bloodPulse * 0.35})`,
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-20">
        <MuteButton />
      </div>

      {showHud && (
        <GameHud
          boss={boss}
          bossHp={state.bossHp}
          stageIndex={state.stageIndex}
          board={state.board}
          timerSec={playing && boss.turnTimerSec ? timerSec : null}
          expectedDamage={playing ? breakdown.finalDamage : state.lastDamage}
          multiplier={playing ? displayMult : Math.max(1, displayMult)}
          canCashOut={playing && canCashOut(state.turn.consecutiveTruths)}
          hand={state.hand}
          relics={state.relics}
          inputLocked={inputLocked}
          onCashOut={() => {
            void unlockAudio()
            dispatch({ type: 'CASH_OUT' })
          }}
          onUseRitual={(ritualId) => {
            void unlockAudio()
            const needsTarget = ritualId === 'clairvoyant_coin'
            const target = state.board.find((c) => !c.revealed && !c.removed)
            const targetCardId = needsTarget ? target?.id : undefined
            fireRitual(ritualId, targetCardId)
            dispatch({
              type: 'USE_RITUAL',
              ritualId,
              targetCardId,
            })
          }}
        />
      )}

      {resolving && state.resolve && <ResolveOverlay info={state.resolve} />}

      <OverlayScreens
        phase={state.phase}
        boss={boss}
        onStart={() => {
          void unlockAudio()
          revivedRef.current = false
          dispatch({ type: 'START_RUN' })
        }}
        onConfirmIntro={() => dispatch({ type: 'CONFIRM_INTRO' })}
        onRetry={() => {
          revivedRef.current = false
          dispatch({ type: 'BACK_TO_TITLE' })
        }}
        onRevive={() => {
          if (revivedRef.current) return
          revivedRef.current = true
          dispatch({ type: 'REVIVE_AD' })
        }}
      />

      {state.phase === 'REWARD' && state.reward && (
        <RewardModal
          offer={state.reward}
          onConfirm={(relicId, ritualId) =>
            dispatch({ type: 'SELECT_REWARD', relicId, ritualId })
          }
        />
      )}
    </div>
  )
}
