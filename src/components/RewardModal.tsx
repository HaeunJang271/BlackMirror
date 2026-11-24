import { motion } from 'framer-motion'
import { useState } from 'react'
import { RELICS } from '../data/relics'
import type { RelicId, RewardChoice, RewardOffer } from '../types/game'

interface RewardModalProps {
  offer: RewardOffer
  refillCount: number
  canRelight: boolean
  onConfirm: (relicId: RelicId, choice: RewardChoice) => void
}

export function RewardModal({ offer, refillCount, canRelight, onConfirm }: RewardModalProps) {
  const [relicId, setRelicId] = useState<RelicId | null>(offer.relicOptions[0] ?? null)
  const [choice, setChoice] = useState<RewardChoice>(refillCount > 0 || !canRelight ? 'rituals' : 'candle')

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 px-4 py-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="max-h-full w-full max-w-sm overflow-y-auto rounded-md border border-brass/40 bg-desk-lift p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl brass-text">봉인이 풀렸다</h2>
        <p className="mt-1 text-xs text-ink-muted">유물 하나와 보급 하나를 선택하라.</p>
        <div className="mt-3 space-y-1.5" aria-label="유물 선택">
          {offer.relicOptions.map((id) => (
            <button key={id} type="button" aria-pressed={relicId === id} onClick={() => setRelicId(id)}
              className={`w-full rounded-sm border px-3 py-2 text-left ${relicId === id ? 'border-brass bg-[#2a2215]' : 'border-brass/25 bg-desk'}`}>
              <p className="text-sm text-brass">{RELICS[id].name}</p>
              <p className="text-[13.31px] text-ink-muted">{RELICS[id].description}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2" aria-label="보급 선택">
          <button type="button" aria-pressed={choice === 'rituals'} onClick={() => setChoice('rituals')}
            className={`rounded-sm border p-2 text-sm ${choice === 'rituals' ? 'border-brass text-brass' : 'border-brass/25 text-ink-muted'}`}>
            의식 {refillCount}장 보충
          </button>
          <button type="button" aria-pressed={choice === 'candle'} onClick={() => setChoice('candle')}
            className={`rounded-sm border p-2 text-sm ${choice === 'candle' ? 'border-brass text-brass' : 'border-brass/25 text-ink-muted'}`}>
            {canRelight ? '촛불 1개 재점화' : '촛불 모두 켜짐'}
          </button>
        </div>
        <button type="button" disabled={!relicId} onClick={() => relicId && onConfirm(relicId, choice)}
          className="mt-4 w-full rounded-sm border border-brass bg-gradient-to-b from-[#3a2e1a] to-[#1a140c] py-2.5 text-sm text-brass disabled:opacity-40">
          선택 완료
        </button>
      </motion.div>
    </div>
  )
}
