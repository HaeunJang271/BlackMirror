import { useEffect, useReducer, useRef, useState } from 'react'
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
 * 《검은 저울》 Phase 3: 1인칭 3D 테이블 + 2D HUD.
 */
export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(20261125),
  )
  const revivedRef = useRef(false)
  const prevPhase = useRef(state.phase)
  const prevTruths = useRef(0)
  const lastTickSec = useRef<number | null>(null)
  const fxToken = useRef(0)
  const [hitFx, setHitFx] = useState(false)
  const [nodFx, setNodFx] = useState(false)

  const boss = getBoss(Math.min(state.stageIndex, 2))
  const breakdown = calculateDamage(toDamageInput(state))
  const playing = state.phase === 'PLAYER_TURN'
  const resolving = state.phase === 'RESOLVING'
  const [timerSec, setTimerSec] = useState<number | null>(null)

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
      fxToken.current += 1
      if (state.resolve?.kind === 'cash_out') {
        void playCashOut()
        setHitFx(true)
        window.setTimeout(() => setHitFx(false), 100)
      } else {
        void playCurseHit()
        setNodFx(true)
        window.setTimeout(() => setNodFx(false), 100)
      }
    }
    prevPhase.current = state.phase
  }, [state.phase, state.resolve?.kind])

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
        onCardClick={(cardId) => {
          void unlockAudio()
          void playCardFlip()
          dispatch({ type: 'FLIP_CARD', cardId })
        }}
      />

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
            dispatch({
              type: 'USE_RITUAL',
              ritualId,
              targetCardId: needsTarget ? target?.id : undefined,
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
