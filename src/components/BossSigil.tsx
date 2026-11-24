import { motion } from 'framer-motion'
import type { BossId } from '../types/game'

interface BossSigilProps {
  bossId: BossId
  hitFlash?: boolean
}

const stroke = '#C5A059'

/**
 * 계약자별 황동 선화 시길 (48×48).
 */
export function BossSigil({ bossId, hitFlash = false }: BossSigilProps) {
  return (
    <motion.div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brass/40 bg-desk-lift/80"
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
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        {bossId === 'blind_clockmaker' && <ClockmakerGlyph />}
        {bossId === 'mirror_priest' && <PriestGlyph />}
        {bossId === 'scale_master' && <ScaleGlyph />}
      </svg>
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

function ClockmakerGlyph() {
  return (
    <>
      <circle cx="24" cy="24" r="14" stroke={stroke} strokeWidth="1.4" />
      <path
        d="M18 16 L30 32"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="14"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="24"
        x2="32"
        y2="26"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="1.6" fill={stroke} />
      <path d="M24 8 V11 M24 37 V40 M8 24 H11 M37 24 H40" stroke={stroke} strokeWidth="1" />
    </>
  )
}

function PriestGlyph() {
  return (
    <>
      <path
        d="M12 38 V18 Q12 10 24 8 Q36 10 36 18 V38"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M16 22 L24 30 L32 22"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M18 18 L30 28 M30 18 L20 28" stroke={stroke} strokeWidth="1" opacity="0.65" />
      <circle cx="24" cy="22" r="3.2" stroke={stroke} strokeWidth="1.2" />
      <circle cx="24" cy="22" r="1.2" fill={stroke} />
    </>
  )
}

function ScaleGlyph() {
  return (
    <>
      <line x1="24" y1="10" x2="24" y2="34" stroke={stroke} strokeWidth="1.4" />
      <line
        x1="12"
        y1="18"
        x2="36"
        y2="14"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 18 Q12 26 8 28 H16 Q12 26 12 18"
        stroke={stroke}
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M36 14 Q36 24 32 27 H40 Q36 24 36 14"
        stroke={stroke}
        strokeWidth="1.2"
        fill="none"
      />
      <line x1="16" y1="34" x2="32" y2="34" stroke={stroke} strokeWidth="1.3" />
      <line x1="20" y1="34" x2="20" y2="38" stroke={stroke} strokeWidth="1" />
      <line x1="28" y1="34" x2="28" y2="38" stroke={stroke} strokeWidth="1" />
    </>
  )
}
