import { useMemo } from 'react'
import { RELICS } from '../data/relics'
import { RITUALS } from '../data/rituals'
import type { BoardCard, BossDef, RelicId, RitualId } from '../types/game'

interface GameHudProps {
  boss: BossDef
  bossHp: number
  stageIndex: number
  board: BoardCard[]
  timerSec: number | null
  expectedDamage: number
  multiplier: number
  canCashOut: boolean
  hand: RitualId[]
  relics: RelicId[]
  inputLocked: boolean
  onCashOut: () => void
  onUseRitual: (ritualId: RitualId) => void
}

/**
 * 남은 미공개 진실/저주 장수를 집계한다.
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
 * 3D 씬 위 반투명 2D HUD (상·하단 중앙 정렬).
 */
export function GameHud({
  boss,
  bossHp,
  stageIndex,
  board,
  timerSec,
  expectedDamage,
  multiplier,
  canCashOut,
  hand,
  relics,
  inputLocked,
  onCashOut,
  onUseRitual,
}: GameHudProps) {
  const remaining = useMemo(() => countRemainingFaces(board), [board])
  const ratio = Math.max(0, bossHp / boss.maxHp)
  const timerUrgent = timerSec !== null && timerSec <= 3

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
      {/* 상단 — 중앙 정렬 */}
      <div className="mx-auto w-full max-w-md px-4 pt-10">
        <div className="rounded-sm border border-brass/25 bg-black/45 px-3 py-2 backdrop-blur-[2px]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 text-left">
              <p className="text-[10px] tracking-[0.2em] text-ink-muted">
                계약자 {stageIndex + 1} / 3
              </p>
              <h1 className="truncate font-[family-name:var(--font-display)] text-lg text-ink">
                {boss.name}
              </h1>
              <p className="mt-1 line-clamp-2 text-[11px] text-ink-muted italic">
                “{boss.introLine}”
              </p>
            </div>
            <span className="shrink-0 rounded-sm border border-brass/40 px-2 py-0.5 text-[10px] text-brass">
              {boss.gimmickBadge}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-ink-muted">봉인</span>
            <span className="brass-text tabular-nums">
              {bossHp} / {boss.maxHp}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-desk-lift ring-1 ring-brass/30">
            <div
              className="h-full origin-left bg-gradient-to-r from-brass-dim to-brass transition-[transform] duration-500"
              style={{ transform: `scaleX(${ratio})` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span>
              진실{' '}
              <span className="brass-text tabular-nums">{remaining.truth}</span>
              <span className="text-ink-muted"> / </span>
              저주{' '}
              <span className="text-curse-glow tabular-nums">{remaining.curse}</span>
            </span>
            {timerSec !== null && (
              <span
                className={`rounded-sm border px-1.5 py-0.5 tabular-nums ${
                  timerUrgent
                    ? 'border-curse text-curse-glow'
                    : 'border-brass/40 text-brass'
                }`}
              >
                {timerSec}s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 하단 — 중앙 정렬 */}
      <div className="mx-auto w-full max-w-md space-y-2 px-3 pb-3">
        <div className="flex items-end justify-between gap-3 rounded-sm border border-brass/20 bg-black/50 px-3 py-2">
          <div>
            <p className="text-[10px] tracking-widest text-ink-muted">
              예상 데미지
            </p>
            <p className="font-[family-name:var(--font-display)] text-3xl brass-text tabular-nums">
              {expectedDamage}
              <span className="ml-2 text-base text-ink-muted">
                ×{multiplier.toFixed(1)}
              </span>
            </p>
          </div>
          <button
            type="button"
            disabled={!canCashOut || inputLocked}
            onClick={onCashOut}
            className="pointer-events-auto rounded-sm border border-brass bg-gradient-to-b from-[#3a2e1a] to-[#1a140c] px-4 py-2.5 text-sm text-brass disabled:border-brass/20 disabled:text-ink-muted/40"
          >
            멈추고 정산
          </button>
        </div>

        <div className="flex justify-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => {
            const id = relics[i]
            const def = id ? RELICS[id] : null
            return (
              <div
                key={i}
                className="flex h-8 w-12 items-center justify-center rounded-sm border border-brass/30 bg-black/45 text-[9px] text-brass"
                title={def ? `${def.name}: ${def.description}` : undefined}
              >
                {def ? def.name.slice(0, 2) : '·'}
              </div>
            )
          })}
        </div>

        <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-1.5">
          {hand.map((id) => {
            const ritual = RITUALS[id]
            return (
              <button
                key={id}
                type="button"
                disabled={inputLocked}
                onClick={() => onUseRitual(id)}
                className="pointer-events-auto rounded-sm border border-brass/45 bg-black/55 px-2 py-1.5 text-left disabled:opacity-40"
              >
                <p className="truncate text-[11px] text-brass">{ritual.name}</p>
                <p className="line-clamp-2 text-[9px] text-ink-muted">
                  {ritual.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
