import { motion } from 'framer-motion'
import type { ResolveInfo } from '../types/game'

interface ResolveOverlayProps {
  info: ResolveInfo
}

/**
 * RESOLVING 인터미션: 데미지 팝업 / 저주·타임아웃 문구 + 비네트.
 */
export function ResolveOverlay({ info }: ResolveOverlayProps) {
  const isHit = info.kind === 'cash_out'

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] flex items-center justify-center">
      {!isHit && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.85, 0] }}
          transition={{ duration: 0.45, times: [0, 0.15, 0.55, 1] }}
          style={{
            boxShadow: 'inset 0 0 90px rgba(139,30,30,0.9)',
            background:
              'radial-gradient(circle, transparent 35%, rgba(139,30,30,0.4) 100%)',
          }}
        />
      )}

      {isHit ? (
        <motion.p
          className="absolute left-1/2 top-[24%] font-[family-name:var(--font-display)] text-5xl brass-text tabular-nums"
          initial={{ opacity: 0, scale: 0.7, x: '-50%', y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1.12, 1, 0.96], y: [20, 0, -25, -60] }}
          transition={{ duration: info.durationMs / 1000 }}
        >
          −{info.damage}
        </motion.p>
      ) : (
        <motion.p
          className="rounded-sm border border-curse/50 bg-desk/80 px-4 py-2 font-[family-name:var(--font-display)] text-xl text-curse-glow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{ duration: info.durationMs / 1000 }}
        >
          {info.message}
        </motion.p>
      )}
    </div>
  )
}
