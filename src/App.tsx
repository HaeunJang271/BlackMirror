import { motion } from 'framer-motion'
import { useEffect, useReducer, useRef, useState } from 'react'
import { OverlayScreens } from './components/OverlayScreens'
import { PlayerDock } from './components/PlayerDock'
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

/**
 * 《검은 저울》 Phase 1 루트. 게임 로직은 reducer에만 둔다.
 */
export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(20261125),
  )
  const revivedRef = useRef(false)
  const boss = getBoss(Math.min(state.stageIndex, 2))
  const breakdown = calculateDamage(toDamageInput(state))
  const playing = state.phase === 'PLAYER_TURN'
  const [timerSec, setTimerSec] = useState<number | null>(null)

  // 시계공 10초 카운트다운 표시 + 만료 시 강제 정산
  useEffect(() => {
    if (!playing || !boss.turnTimerSec) {
      setTimerSec(null)
      return
    }

    const limit = boss.turnTimerSec
    setTimerSec(limit)
    const startedAt = Date.now()

    const tick = window.setInterval(() => {
      const left = Math.max(0, limit - Math.floor((Date.now() - startedAt) / 1000))
      setTimerSec(left)
      if (left <= 0) {
        window.clearInterval(tick)
        log('info', 'turn timer expired')
        dispatch({ type: 'TIMER_EXPIRED' })
      }
    }, 200)

    return () => window.clearInterval(tick)
  }, [playing, boss.turnTimerSec, state.round])

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

  return (
    <div className="desk-grain mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden">
      <motion.div
        className="relative flex h-full min-h-0 flex-col"
        animate={
          state.lastDamage > 0 && playing
            ? { x: [0, -4, 4, -2, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.35 }}
      >
        <StageHeader
          boss={boss}
          bossHp={state.bossHp}
          stageIndex={state.stageIndex}
        />

        <ScaleBoard
          board={state.board}
          expectedDamage={playing ? breakdown.finalDamage : 0}
          multiplier={playing ? displayMult : 1}
          canCashOut={playing && canCashOut(state.turn.consecutiveTruths)}
          flipDisabled={!playing}
          lastDamage={state.lastDamage}
          timerSec={playing ? timerSec : null}
          onFlip={(cardId) => dispatch({ type: 'FLIP_CARD', cardId })}
          onCashOut={() => dispatch({ type: 'CASH_OUT' })}
        />

        <PlayerDock
          candles={state.candles}
          relics={state.relics}
          hand={state.hand}
          disabled={!playing}
          onUseRitual={(ritualId) => {
            const needsTarget = ritualId === 'clairvoyant_coin'
            const target = state.board.find((c) => !c.revealed && !c.removed)
            dispatch({
              type: 'USE_RITUAL',
              ritualId,
              targetCardId: needsTarget ? target?.id : undefined,
            })
          }}
        />

        {state.curseFlash && (
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              boxShadow: 'inset 0 0 80px rgba(139,30,30,0.85)',
              background:
                'radial-gradient(circle, transparent 40%, rgba(139,30,30,0.35) 100%)',
            }}
          />
        )}

        <OverlayScreens
          phase={state.phase}
          boss={boss}
          onStart={() => {
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
      </motion.div>
    </div>
  )
}
