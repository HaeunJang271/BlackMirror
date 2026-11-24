import { motion } from 'framer-motion'
import { useState } from 'react'
import { RELICS } from '../data/relics'
import { RITUALS } from '../data/rituals'
import type { RelicId, RewardOffer, RitualId } from '../types/game'

interface RewardModalProps {
  offer: RewardOffer
  onConfirm: (relicId: RelicId, ritualId: RitualId) => void
}

/**
 * 스테이지 클리어 보상: 유물 1 + 의식 카드 2 중 택1.
 */
export function RewardModal({ offer, onConfirm }: RewardModalProps) {
  const relicId = offer.relicOptions[0]
  const [ritualId, setRitualId] = useState<RitualId | null>(
    offer.ritualOptions[0] ?? null,
  )

  if (!relicId || !ritualId) {
    return null
  }

  const relic = RELICS[relicId]

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-md border border-brass/40 bg-desk-lift p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl brass-text">
          봉인이 풀렸다
        </h2>
        <p className="mt-1 text-xs text-ink-muted">유물을 받고, 의식 카드 하나를 택하라.</p>

        <div className="mt-4 rounded-sm border border-brass/30 bg-desk p-3">
          <p className="text-[10px] tracking-widest text-ink-muted">유물</p>
          <p className="mt-1 text-sm text-brass">{relic.name}</p>
          <p className="mt-1 text-[11px] text-ink-muted">{relic.description}</p>
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-[10px] tracking-widest text-ink-muted">의식 카드 택1</p>
          {offer.ritualOptions.map((id) => {
            const r = RITUALS[id]
            const selected = ritualId === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRitualId(id)}
                className={`w-full rounded-sm border px-3 py-2 text-left ${
                  selected
                    ? 'border-brass bg-[#2a2215]'
                    : 'border-brass/25 bg-desk'
                }`}
              >
                <p className="text-sm text-brass">{r.name}</p>
                <p className="text-[11px] text-ink-muted">{r.description}</p>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onConfirm(relicId, ritualId)}
          className="mt-4 w-full rounded-sm border border-brass bg-gradient-to-b from-[#3a2e1a] to-[#1a140c] py-2.5 text-sm text-brass"
        >
          다음 계약자로
        </button>
      </motion.div>
    </div>
  )
}
