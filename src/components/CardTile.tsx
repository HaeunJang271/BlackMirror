import { motion } from 'framer-motion'
import type { BoardCard } from '../types/game'

interface CardTileProps {
  card: BoardCard
  disabled?: boolean
  onFlip: (cardId: string) => void
}

/**
 * 3D 플립 카드. 진실은 황동, 저주는 핏빛으로 드러난다.
 */
export function CardTile({ card, disabled, onFlip }: CardTileProps) {
  const faceUp = card.revealed
  const showPeek = card.peeked && !card.revealed

  if (card.removed) {
    return (
      <div
        className="aspect-[2/3] rounded-md border border-dashed border-brass/20 opacity-30"
        aria-hidden
      />
    )
  }

  return (
    <button
      type="button"
      disabled={disabled || faceUp}
      onClick={() => onFlip(card.id)}
      className="relative aspect-[2/3] w-full [perspective:800px] disabled:cursor-default"
      aria-label={faceUp ? `공개됨 ${card.face}` : '덮인 패'}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 뒷면 */}
        <div className="absolute inset-0 flex items-center justify-center rounded-md border border-brass/40 bg-gradient-to-br from-[#1a1510] to-[#0c0a08] shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] [backface-visibility:hidden]">
          <div className="h-8 w-8 rotate-45 border border-brass/50" />
          {showPeek && (
            <span
              className={`absolute bottom-1.5 text-[9px] font-medium tracking-wider ${
                card.face === 'curse' ? 'text-curse' : 'text-brass'
              }`}
            >
              {card.face === 'curse' ? '저주' : '진실'}
            </span>
          )}
          {card.fakeHint && !faceUp && (
            <motion.div
              className="absolute inset-1 rounded border border-brass/30"
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}
        </div>

        {/* 앞면 */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-md border [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            card.face === 'truth'
              ? 'border-brass bg-gradient-to-b from-[#2a2215] to-[#15110c] text-brass'
              : 'border-curse bg-gradient-to-b from-[#2a1010] to-[#120808] text-curse-glow'
          }`}
        >
          <span className="font-[family-name:var(--font-display)] text-lg tracking-wide">
            {card.face === 'truth' ? '진실' : '저주'}
          </span>
        </div>
      </motion.div>
    </button>
  )
}
