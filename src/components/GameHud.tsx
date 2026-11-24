import { useMemo, useState } from 'react'
import { Eye, Skull } from 'lucide-react'
import { RELICS } from '../data/relics'
import { RITUALS } from '../data/rituals'
import type { BoardCard, BossDef, RelicId, RitualId } from '../types/game'
import { countRemainingFaces } from '../utils/boardStats'
import { RELIC_ICONS, RITUAL_ICONS } from './HudIcons'

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
  ashBreathAvailable: boolean
  relics: RelicId[]
  inputLocked: boolean
  onCashOut: () => void
  onUseRitual: (ritualId: RitualId) => void
}

interface SkillTip {
  name: string
  description: string
}

/**
 * 3D 씬 위 반투명 2D HUD.
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
  ashBreathAvailable,
  relics,
  inputLocked,
  onCashOut,
  onUseRitual,
}: GameHudProps) {
  const remaining = useMemo(() => countRemainingFaces(board), [board])
  const ratio = Math.max(0, bossHp / boss.maxHp)
  const timerUrgent = timerSec !== null && timerSec <= 3
  const [tip, setTip] = useState<SkillTip | null>(null)

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      {/* 오른쪽 컬럼: 보스스탯 → 스킬설명 → 스킬창 */}
      <div className="ml-auto flex h-full w-full max-w-[36.4rem] flex-col px-4 pb-3 pt-10">
        {/* 보스 스탯 */}
        <div className="w-full max-w-[31.2rem] shrink-0 self-end rounded-sm border border-brass/25 bg-black/45 px-4 py-2.5 backdrop-blur-[2px]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 text-left">
              <p className="text-[15.73px] tracking-[0.2em] text-ink-muted">
                계약자 {stageIndex + 1} / 3
              </p>
              <h1 className="truncate font-[family-name:var(--font-display)] text-[1.694rem] leading-tight text-ink">
                {boss.name}
              </h1>
              <p className="mt-1.5 line-clamp-2 text-[16.94px] text-ink-muted italic">
                “{boss.introLine}”
              </p>
            </div>
            <span className="shrink-0 rounded-sm border border-brass/40 px-2.5 py-1 text-[15.73px] text-brass">
              {boss.gimmickBadge}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[15.73px]">
            <span className="text-ink-muted">봉인</span>
            <span className="brass-text tabular-nums">
              {bossHp} / {boss.maxHp}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-desk-lift ring-1 ring-brass/30">
            <div
              className="h-full origin-left bg-gradient-to-r from-brass-dim to-brass transition-[transform] duration-500"
              style={{ transform: `scaleX(${ratio})` }}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3.5 text-[16.94px]">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-[1.125rem] w-[1.125rem] text-brass" aria-hidden />
              <span className="brass-text tabular-nums">{remaining.truth}</span>
              <span className="text-ink-muted">/</span>
              <Skull
                className="h-[1.125rem] w-[1.125rem] text-curse-glow"
                aria-hidden
              />
              <span className="text-curse-glow tabular-nums">{remaining.curse}</span>
            </span>
            {timerSec !== null && (
              <span
                className={`rounded-sm border px-2 py-0.5 tabular-nums ${
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

        <div className="min-h-0 flex-1" aria-hidden />

        {/* 스킬 설명 — 스킬창 바로 위 */}
        <div
          className="mb-1.5 w-full max-w-[31.2rem] shrink-0 self-end rounded-sm border border-brass/20 px-4 py-2.5"
          style={{
            background: 'rgba(12, 10, 8, 0.55)',
            boxShadow: tip
              ? 'inset 0 0 0 1px rgba(197,160,89,0.15)'
              : undefined,
          }}
          role="status"
          aria-live="polite"
        >
          {tip ? (
            <>
              <p className="font-[family-name:var(--font-display)] text-[1.2705rem] text-[#e8c878]">
                {tip.name}
              </p>
              <p className="mt-1 text-[15.73px] leading-relaxed text-[#c4b496]">
                {tip.description}
              </p>
            </>
          ) : (
            <p className="text-[14.52px] text-[#9a8b72]/70">
              의식·유물 아이콘에 올리면 설명이 표시됩니다
            </p>
          )}
        </div>

        {/* 하단 스킬창 */}
        <div
          className="w-full max-w-[31.2rem] shrink-0 space-y-2.5 self-end rounded-sm p-2.5"
          style={{
            background:
              'linear-gradient(180deg, rgba(42,34,24,0.72) 0%, rgba(22,18,14,0.82) 100%)',
            boxShadow:
              '0 0 28px rgba(232,168,86,0.12), inset 0 1px 0 rgba(197,160,89,0.18)',
          }}
        >
          <div className="flex items-end justify-between gap-3 rounded-sm border border-brass/35 bg-[#2a2218]/90 px-4 py-2.5">
            <div>
              <p className="text-[15.73px] tracking-widest text-[#cbb896]">
                예상 데미지
              </p>
              <p className="font-[family-name:var(--font-display)] text-[3.025rem] leading-none brass-text tabular-nums">
                {expectedDamage}
                <span className="ml-2 text-[1.573rem] text-[#d4c4a0]">
                  ×{multiplier.toFixed(1)}
                </span>
              </p>
            </div>
            <button
              type="button"
              disabled={!canCashOut || inputLocked}
              onClick={onCashOut}
              className="pointer-events-auto rounded-sm border border-brass bg-gradient-to-b from-[#4a3a22] to-[#2a2014] px-5 py-3 text-[1.2705rem] font-medium text-[#f0d9a0] disabled:border-brass/20 disabled:text-[#9a8b72]/50"
            >
              멈추고 정산
            </button>
          </div>

          <div className="flex justify-end gap-2" aria-label="의식">
            {Array.from({ length: 4 }).map((_, i) => {
              const id = hand[i]
              const ritual = id ? RITUALS[id] : null
              const Icon = id ? RITUAL_ICONS[id] : null
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!ritual || inputLocked || (id === 'ash_breath' && !ashBreathAvailable)}
                  onClick={() => {
                    if (id) onUseRitual(id)
                  }}
                  onPointerEnter={() => {
                    if (ritual) {
                      setTip({
                        name: ritual.name,
                        description: ritual.description,
                      })
                    }
                  }}
                  onPointerLeave={() => setTip(null)}
                  onFocus={() => {
                    if (ritual) {
                      setTip({
                        name: ritual.name,
                        description: ritual.description,
                      })
                    }
                  }}
                  onBlur={() => setTip(null)}
                  aria-label={ritual?.name ?? '빈 의식 슬롯'}
                  className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-sm border border-brass/50 bg-[#2c241a]/95 text-[#e8c878] disabled:opacity-35"
                >
                  {Icon ? <Icon className="h-7 w-7" strokeWidth={1.75} /> : null}
                </button>
              )
            })}
          </div>

          <div className="flex justify-end gap-1.5" aria-label="유물">
            {Array.from({ length: 4 }).map((_, i) => {
              const id = relics[i]
              const def = id ? RELICS[id] : null
              const Icon = id ? RELIC_ICONS[id] : null
              return (
                <div
                  key={i}
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-sm border border-brass/40 bg-[#2a2218] text-[#e8c878]"
                  aria-label={def?.name ?? '빈 유물 슬롯'}
                  onPointerEnter={() => {
                    if (def) {
                      setTip({ name: def.name, description: def.description })
                    }
                  }}
                  onPointerLeave={() => setTip(null)}
                >
                  {Icon ? (
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  ) : (
                    <span className="text-[13px] text-[#9a8b72]">·</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
