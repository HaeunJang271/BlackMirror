import { motion } from 'framer-motion'
import type { BossId } from '../types/game'
import { BOSS_PORTRAIT_URL } from '../scene/bossPortraits'

interface BossSigilProps {
  bossId: BossId
  hitFlash?: boolean
}

/**
 * 계약자 초상화 시길 (제공 JPG).
 */
export function BossSigil({ bossId, hitFlash = false }: BossSigilProps) {
  return (
    <motion.div
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-brass/40 bg-desk-lift/80"
      animate={
        hitFlash
          ? {
              x: [-6, 6, -4, 4, 0],
              filter: [
                'drop-shadow(0 0 0px #8B1E1E)',
                'drop-shadow(0 0 10px #8B1E1E)',
                'drop-shadow(0 0 0px #8B1E1E)',
              ],
            }
          : { x: 0, filter: 'drop-shadow(0 0 0px #8B1E1E)' }
      }
      transition={{ duration: 0.55 }}
      aria-hidden
    >
      <img
        src={BOSS_PORTRAIT_URL[bossId]}
        alt=""
        className="h-full w-full object-cover object-top"
        draggable={false}
      />
      {hitFlash && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full bg-curse/35"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
        />
      )}
    </motion.div>
  )
}
