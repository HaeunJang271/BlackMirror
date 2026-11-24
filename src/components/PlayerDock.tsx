import { motion } from 'framer-motion'
import { useState } from 'react'
import { RELICS } from '../data/relics'
import { RITUALS } from '../data/rituals'
import type { RelicId, RitualId } from '../types/game'

interface PlayerDockProps {
  candles: number
  relics: RelicId[]
  hand: RitualId[]
  disabled?: boolean
  onUseRitual: (ritualId: RitualId) => void
}

/**
 * 하단 30%: 촛불 · 유물 슬롯 · 의식 카드 손패.
 */
export function PlayerDock({
  candles,
  relics,
  hand,
  disabled,
  onUseRitual,
}: PlayerDockProps) {
  const [tip, setTip] = useState<string | null>(null)

  return (
    <footer className="flex h-[30%] flex-col justify-between border-t border-brass/15 bg-black/25 px-3 pb-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        {/* 촛불 3 */}
        <div className="flex gap-2" aria-label={`촛불 ${candles}개`}>
          {[0, 1, 2].map((i) => {
            const lit = i < candles
            return (
              <div key={i} className="relative flex h-10 w-6 flex-col items-center">
                {lit && (
                  <motion.div
                    className="absolute -top-1 h-3 w-2 rounded-full bg-wax"
                    animate={{
                      scaleY: [1, 1.25, 0.9, 1],
                      opacity: [0.85, 1, 0.9, 0.85],
                    }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    style={{
                      boxShadow: '0 0 10px rgba(232,168,86,0.7)',
                    }}
                  />
                )}
                <div
                  className={`mt-auto h-6 w-2.5 rounded-b-sm ${
                    lit
                      ? 'bg-gradient-to-b from-[#3a2a18] to-[#1a1208]'
                      : 'bg-[#1a1210] opacity-40'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* 유물 슬롯 4 */}
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => {
            const id = relics[i]
            const def = id ? RELICS[id] : null
            return (
              <button
                key={i}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-brass/30 bg-desk-lift text-[9px] leading-tight text-brass"
                onClick={() => setTip(def ? `${def.name}: ${def.description}` : null)}
                aria-label={def?.name ?? '빈 유물 슬롯'}
              >
                {def ? def.name.slice(0, 2) : '·'}
              </button>
            )
          })}
        </div>
      </div>

      {tip && (
        <p className="truncate text-[10px] text-ink-muted" role="status">
          {tip}
        </p>
      )}

      {/* 손패 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {hand.length === 0 && (
          <p className="text-[10px] text-ink-muted">손패가 비어 있습니다</p>
        )}
        {hand.map((id) => {
          const ritual = RITUALS[id]
          return (
            <motion.button
              key={id}
              type="button"
              disabled={disabled}
              whileTap={disabled ? undefined : { y: 2 }}
              onClick={() => onUseRitual(id)}
              className="min-w-[4.5rem] shrink-0 rounded-sm border border-brass/45 bg-gradient-to-b from-[#241c12] to-[#120e0a] px-2 py-1.5 text-left disabled:opacity-40"
            >
              <p className="text-[11px] font-medium text-brass">{ritual.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-ink-muted">
                {ritual.description}
              </p>
            </motion.button>
          )
        })}
      </div>
    </footer>
  )
}
