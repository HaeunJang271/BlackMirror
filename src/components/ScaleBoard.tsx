import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import type { BoardCard } from '../types/game'
import { CardTile } from './CardTile'

interface ScaleBoardProps {
  board: BoardCard[]
  expectedDamage: number
  multiplier: number
  canCashOut: boolean
  flipDisabled: boolean
  lastDamage: number
  /** 턴 제한 초. 없으면 타이머 숨김 */
  timerSec: number | null
  onFlip: (cardId: string) => void
  onCashOut: () => void
}

/**
 * 남은 미공개 패의 진실/저주 장수를 집계한다.
 */
export function countRemainingFaces(board: BoardCard[]): {
  truth: number
  curse: number
} {
  return board.reduce(
    (acc, card) => {
      if (card.revealed || card.removed) return acc
      if (card.face === 'truth') acc.truth += 1
      else acc.curse += 1
      return acc
    },
    { truth: 0, curse: 0 },
  )
}

/**
 * 중앙 45%: 황동 저울 + 비율 + 5장 패 + 정산 버튼.
 */
export function ScaleBoard({
  board,
  expectedDamage,
  multiplier,
  canCashOut,
  flipDisabled,
  lastDamage,
  timerSec,
  onFlip,
  onCashOut,
}: ScaleBoardProps) {
  const spring = useSpring(0, { stiffness: 80, damping: 18 })
  const display = useTransform(spring, (v) => Math.round(v))
  const remaining = useMemo(() => countRemainingFaces(board), [board])

  useEffect(() => {
    spring.set(expectedDamage)
  }, [expectedDamage, spring])

  const tilt = Math.min(18, multiplier * 4)
  const timerUrgent = timerSec !== null && timerSec <= 3

  return (
    <section className="flex h-[45%] min-h-0 flex-col items-center justify-between px-3 py-1">
      <div className="relative flex w-full max-w-sm flex-col items-center">
        <motion.div
          className="relative flex h-12 w-40 items-end justify-center"
          animate={{ rotate: lastDamage > 0 ? [-tilt, tilt, 0] : -tilt * 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <div className="absolute bottom-2 h-1 w-36 rounded-full bg-brass shadow-[0_0_12px_rgba(197,160,89,0.4)]" />
          <div className="absolute bottom-3 left-2 h-5 w-5 rounded-full border border-brass/60 bg-desk-lift" />
          <div className="absolute bottom-3 right-2 h-5 w-5 rounded-full border border-brass/60 bg-desk-lift" />
          <div className="absolute bottom-0 h-3 w-1 bg-brass-dim" />
        </motion.div>

        <div className="mt-0.5 flex items-baseline gap-3">
          <motion.span className="font-[family-name:var(--font-display)] text-3xl brass-text tabular-nums">
            {display}
          </motion.span>
          <span className="text-sm text-ink-muted tabular-nums">
            ×{multiplier.toFixed(1)}
          </span>
          {timerSec !== null && (
            <span
              className={`ml-1 rounded-sm border px-1.5 py-0.5 text-xs tabular-nums ${
                timerUrgent
                  ? 'border-curse text-curse-glow'
                  : 'border-brass/40 text-brass'
              }`}
              aria-live="polite"
            >
              {timerSec}s
            </span>
          )}
        </div>
        <p className="text-[10px] tracking-widest text-ink-muted">예상 데미지</p>

        <p className="mt-1 text-[11px] tracking-wide text-ink">
          진실{' '}
          <span className="brass-text tabular-nums">{remaining.truth}</span>장
          <span className="mx-1.5 text-ink-muted">/</span>
          저주{' '}
          <span className="text-curse-glow tabular-nums">{remaining.curse}</span>
          장
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-5 gap-1.5 px-1">
        {board.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            disabled={flipDisabled}
            onFlip={onFlip}
          />
        ))}
      </div>

      <motion.button
        type="button"
        disabled={!canCashOut}
        onClick={onCashOut}
        whileTap={canCashOut ? { scale: 0.97 } : undefined}
        className="w-full max-w-xs shrink-0 rounded-sm border border-brass bg-gradient-to-b from-[#3a2e1a] to-[#1a140c] py-2 text-sm font-medium tracking-wide text-brass shadow-[0_4px_16px_rgba(0,0,0,0.45)] disabled:border-brass/20 disabled:text-ink-muted/40 disabled:shadow-none"
      >
        멈추고 정산
      </motion.button>
    </section>
  )
}
