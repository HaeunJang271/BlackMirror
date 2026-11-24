import { useEffect, useReducer, useRef, useState } from 'react'
import { MuteButton } from './components/MuteButton'
import { OverlayScreens } from './components/OverlayScreens'
import { PlayerDock } from './components/PlayerDock'
import { ResolveOverlay } from './components/ResolveOverlay'
import { RewardModal } from './components/RewardModal'
import { ScaleBoard } from './components/ScaleBoard'
import { StageHeader } from './components/StageHeader'
import { getBoss } from './data/bosses'
import { calculateDamage, canCashOut } from './engine/calculator'
import {
  createInitialState,
  gameReducer,
  toDamageInput,
} from './engine/reducer'
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
 * 《검은 저울》 Phase 2 루트. 로직은 reducer, 연출·사운드는 여기서 연결.
 */
export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(20261125),
  )
  const revivedRef = useRef(false)
  const prevPhase = useRef(state.phase)
  const prevTruths = useRef(0)
  const lastTickSec = useRef<number | null>(null)
  const boss = getBoss(Math.min(state.stageIndex, 2))
  const breakdown = calculateDamage(toDamageInput(state))
  const playing = state.phase === 'PLAYER_TURN'
  const resolving = state.phase === 'RESOLVING'
  const [timerSec, setTimerSec] = useState<number | null>(null)

  // 첫 패 플립 이후에만 타이머 가동
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

  // RESOLVING 인터미션 종료
  useEffect(() => {
    if (!resolving || !state.resolve) return
    const id = window.setTimeout(() => {
      dispatch({ type: 'FINISH_RESOLVE' })
    }, state.resolve.durationMs)
    return () => window.clearTimeout(id)
  }, [resolving, state.resolve])

  // 결과 진입 사운드
  useEffect(() => {
    if (state.phase === 'RESOLVING' && prevPhase.current !== 'RESOLVING') {
      if (state.resolve?.kind === 'cash_out') void playCashOut()
      else void playCurseHit()
    }
    prevPhase.current = state.phase
  }, [state.phase, state.resolve?.kind])

  // 진실 콤보 차임
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

  const displayMult =
    breakdown.comboMultiplier *
    breakdown.ritualMultiplier *
    breakdown.relicMultiplier

  const hitFlash =
    resolving && state.resolve?.kind === 'cash_out' && state.lastDamage > 0

  const inputLocked = !playing

  return (
    <div className="desk-grain mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden">
      <div className="relative flex h-full min-h-0 flex-col">
        <MuteButton />

        <StageHeader
          boss={boss}
          bossHp={state.bossHp}
          stageIndex={state.stageIndex}
          hitFlash={Boolean(hitFlash)}
        />

        <ScaleBoard
          board={state.board}
          expectedDamage={playing ? breakdown.finalDamage : state.lastDamage}
          multiplier={playing ? displayMult : Math.max(1, displayMult)}
          canCashOut={playing && canCashOut(state.turn.consecutiveTruths)}
          flipDisabled={inputLocked}
          lastDamage={state.lastDamage}
          timerSec={
            playing && boss.turnTimerSec
              ? timerSec
              : null
          }
          onFlip={(cardId) => {
            void unlockAudio()
            void playCardFlip()
            dispatch({ type: 'FLIP_CARD', cardId })
          }}
          onCashOut={() => {
            void unlockAudio()
            dispatch({ type: 'CASH_OUT' })
          }}
        />

        <PlayerDock
          candles={state.candles}
          relics={state.relics}
          hand={state.hand}
          disabled={inputLocked}
          resolve={state.resolve}
          onUseRitual={(ritualId) => {
            void unlockAudio()
            const needsTarget = ritualId === 'clairvoyant_coin'
            const target = state.board.find((c) => !c.revealed && !c.removed)
            dispatch({
              type: 'USE_RITUAL',
              ritualId,
              targetCardId: needsTarget ? target?.id : undefined,
            })
          }}
        />

        {resolving && state.resolve && (
          <ResolveOverlay info={state.resolve} />
        )}

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
    </div>
  )
}
