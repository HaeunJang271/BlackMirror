import { motion } from 'framer-motion'
import type { BossDef } from '../types/game'
import { BossSigil } from './BossSigil'

interface StageHeaderProps {
  boss: BossDef
  bossHp: number
  stageIndex: number
  hitFlash?: boolean
}

/**
 * 상단 25%: 계약자·대사·봉인 게이지·기믹 배지·시길.
 */
export function StageHeader({
  boss,
  bossHp,
  stageIndex,
  hitFlash = false,
}: StageHeaderProps) {
  const ratio = Math.max(0, bossHp / boss.maxHp)

  return (
    <motion.header
      className="flex h-[25%] flex-col justify-between px-4 pb-2 pt-3"
      animate={hitFlash ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="flex items-start justify-between gap-3 pr-8">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] text-ink-muted uppercase">
            계약자 {stageIndex + 1} / 3
          </p>
          <h1 className="mt-0.5 truncate font-[family-name:var(--font-display)] text-xl text-ink md:text-2xl">
            {boss.name}
          </h1>
          <p className="mt-1 line-clamp-2 text-xs text-ink-muted italic">
            “{boss.introLine}”
          </p>
        </div>

        <BossSigil bossId={boss.id} hitFlash={hitFlash} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-ink-muted">봉인</span>
          <span className="brass-text tabular-nums">
            {bossHp} / {boss.maxHp}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-sm bg-desk-lift ring-1 ring-brass/30">
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-brass-dim to-brass"
            animate={{ scaleX: ratio }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{ scaleX: ratio }}
          />
        </div>
        <span className="inline-flex items-center rounded-sm border border-brass/40 bg-desk-lift/80 px-2 py-0.5 text-[10px] tracking-wide text-brass">
          {boss.gimmickBadge}
        </span>
      </div>
    </motion.header>
  )
}
