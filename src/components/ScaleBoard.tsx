import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import type { BoardCard } from '../types/game'
import { CardTile } from './CardTile'

interface ScaleBoardProps {
  board: BoardCard[]
  expectedDamage: number
  multiplier: number
  canCashOut: boolean
  flipDisabled: boolean
  lastDamage: number
  onFlip: (cardId: string) => void
  onCashOut: () => void
}

/**
 * 중앙 45%: 황동 저울 + 5장 패 + 정산 버튼.
 */
export function ScaleBoard({
  board,
  expectedDamage,
  multiplier,
  canCashOut,
  flipDisabled,
  lastDamage,
  onFlip,
  onCashOut,
}: ScaleBoardProps) {
  const spring = useSpring(0, { stiffness: 80, damping: 18 })
  const display = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    spring.set(expectedDamage)
  }, [expectedDamage, spring])

  const tilt = Math.min(18, multiplier * 4)

  return (
    <section className="flex h-[45%] flex-col items-center justify-between px-3 py-1">
      {/* 저울 */}
      <div className="relative flex w-full max-w-sm flex-col items-center">
        <motion.div
          className="relative flex h-14 w-40 items-end justify-center"
          animate={{ rotate: lastDamage > 0 ? [-tilt, tilt, 0] : -tilt * 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <div className="absolute bottom-2 h-1 w-36 rounded-full bg-brass shadow-[0_0_12px_rgba(197,160,89,0.4)]" />
          <div className="absolute bottom-3 left-2 h-6 w-6 rounded-full border border-brass/60 bg-desk-lift" />
          <div className="absolute bottom-3 right-2 h-6 w-6 rounded-full border border-brass/60 bg-desk-lift" />
          <div className="absolute bottom-0 h-3 w-1 bg-brass-dim" />
        </motion.div>
        <div className="mt-1 flex items-baseline gap-3">
          <motion.span className="font-[family-name:var(--font-display)] text-3xl brass-text tabular-nums">
            {display}
          </motion.span>
          <span className="text-sm text-ink-muted tabular-nums">
            ×{multiplier.toFixed(1)}
          </span>
        </div>
        <p className="text-[10px] tracking-widest text-ink-muted">예상 데미지</p>
      </div>

      {/* 패 그리드 */}
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
        className="mt-1 w-full max-w-xs rounded-sm border border-brass bg-gradient-to-b from-[#3a2e1a] to-[#1a140c] py-2.5 text-sm font-medium tracking-wide text-brass shadow-[0_4px_16px_rgba(0,0,0,0.45)] disabled:border-brass/20 disabled:text-ink-muted/40 disabled:shadow-none"
      >
        멈추고 정산
      </motion.button>
    </section>
  )
}
