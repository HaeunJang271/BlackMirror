import { useMemo, useRef, useState } from 'react'
import { Eye, Skull } from 'lucide-react'
import { RELICS } from '../data/relics'
import { RITUALS } from '../data/rituals'
import type { BoardCard, BossDef, RelicId, RitualId } from '../types/game'
import { countRemainingFaces } from '../utils/boardStats'
import { RELIC_ICONS, RITUAL_ICONS } from './HudIcons'

interface GameHudProps {
  tutorialHint?: 'first' | 'retry' | 'next' | 'truth' | 'more' | 'ritual' | null
  boss: BossDef
  bossLine: string
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
  tutorialHint,
  boss,
  bossLine,
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
  const [selected, setSelected] = useState<string | null>(null)
  const pointerType = useRef('mouse')
  const showTip = (key: string, item: SkillTip) => {
    setSelected(key)
    setTip(item)
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      {tutorialHint && (
        <p role="status" className={`tutorial-hint absolute left-1/2 w-max max-w-[90%] -translate-x-1/2 text-center ${tutorialHint === 'ritual' ? 'top-1/2 -translate-y-1/2' : 'top-[20%]'}`}>
          {tutorialHint === 'first' ? '패를 눌러 진실을 찾으세요. 첫 진실을 찾으면 의식 사용을 안내합니다.'
            : tutorialHint === 'retry' ? '저주는 촛불을 끕니다. 다시 패를 열어 진실을 찾으세요.'
            : tutorialHint === 'next' ? '패를 열고 정산해 봉인을 깨세요.'
            : tutorialHint === 'truth' ? '진실을 찾았습니다. 정산해 봉인을 깎으세요.'
            : tutorialHint === 'more' ? '더 열어 배수를 키우거나, 지금 정산해 봉인을 깎으세요.'
              : '의식을 사용하면 다시 패를 열 수 있습니다. 한 번 터치하면 설명, 두 번 터치하면 사용합니다.'}
        </p>
      )}
      <div className="mx-3 w-auto shrink-0 border-b border-brass/25 bg-black/70 px-3 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))] sm:hidden">
        <div className="flex h-8 items-center gap-2 pr-10 text-[12px]">
          <span className="min-w-0 truncate font-medium text-ink">{boss.name}</span>
          <span className="truncate text-brass">{boss.gimmickBadge}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] leading-4">
          <span className="shrink-0 text-ink-muted">봉인 {bossHp}/{boss.maxHp}</span>
          <div className="h-1.5 min-w-4 flex-1 overflow-hidden rounded-sm bg-desk-lift ring-1 ring-brass/30">
            <div className="h-full bg-brass transition-[transform] duration-500 origin-left" style={{ transform: `scaleX(${ratio})` }} />
          </div>
          <span className="shrink-0 text-ink-muted">진실 {remaining.truth} / 저주 {remaining.curse}</span>
          {timerSec !== null && <span className={timerUrgent ? 'text-curse-glow' : 'text-brass'}>{timerSec}초</span>}
        </div>
      </div>
      {/* 오른쪽 컬럼: 보스스탯 → 스킬설명 → 스킬창 */}
      <div className="flex min-h-0 w-full flex-1 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:ml-auto sm:h-full sm:max-w-[36.4rem] sm:px-4 sm:pt-[max(2.5rem,env(safe-area-inset-top))]">
        {/* 보스 스탯 */}
        <div className="hidden w-full max-w-[31.2rem] shrink-0 self-end rounded-sm border border-brass/25 bg-black/45 px-4 py-2.5 backdrop-blur-[2px] sm:block">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 text-left">
              <p className="text-[15.73px] tracking-[0.2em] text-ink-muted">
                계약자 {stageIndex + 1} / 3
              </p>
              <h1 className="truncate font-[family-name:var(--font-display)] text-[1.694rem] leading-tight text-ink">
                {boss.name}
              </h1>
              <p aria-live="polite" className="mt-1.5 text-[16.94px] text-ink-muted italic">
                “{bossLine}”
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
          className="mb-1 w-full max-w-none shrink-0 self-end rounded-sm border border-brass/20 sm:max-w-[31.2rem] px-2 py-1 sm:mb-1.5 sm:px-4 sm:py-2.5"
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
              <p className="inline font-[family-name:var(--font-display)] text-[12px] text-[#e8c878] sm:block sm:text-[1.2705rem]">
                {tip.name}
              </p>
              <p className="ml-1 inline text-[11px] leading-tight text-[#c4b496] sm:ml-0 sm:mt-1 sm:block sm:text-[15.73px] sm:leading-relaxed">
                {tip.description}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-[#9a8b72]/70 sm:text-[14.52px]">
              <span className="touch-hint">아이콘을 탭하면 설명, 한 번 더 누르면 사용</span><span className="mouse-hint">의식·유물 아이콘에 올리면 설명이 표시됩니다</span>
            </p>
          )}
        </div>

        {/* 하단 스킬창 */}
        <div
          className="w-full max-w-none shrink-0 space-y-1 self-end sm:max-w-[31.2rem] rounded-sm p-1.5 sm:space-y-2.5 sm:p-2.5"
          style={{
            background:
              'linear-gradient(180deg, rgba(42,34,24,0.72) 0%, rgba(22,18,14,0.82) 100%)',
            boxShadow:
              '0 0 28px rgba(232,168,86,0.12), inset 0 1px 0 rgba(197,160,89,0.18)',
          }}
        >
          <div className="flex items-center justify-between gap-2 rounded-sm border border-brass/35 bg-[#2a2218]/90 px-2 py-1 sm:items-end sm:gap-3 sm:px-4 sm:py-2.5">
            <div className="flex items-baseline gap-2 sm:block">
              <p className="text-[11px] text-[#cbb896] sm:text-[15.73px] sm:tracking-widest">
                예상 데미지
              </p>
              <p className="font-[family-name:var(--font-display)] text-[1.3rem] sm:text-[3.025rem] leading-none brass-text tabular-nums">
                {expectedDamage}
                <span className="ml-2 text-[0.8rem] sm:text-[1.573rem] text-[#d4c4a0]">
                  ×{multiplier.toFixed(1)}
                </span>
              </p>
            </div>
            <button
              type="button"
              disabled={!canCashOut || inputLocked}
              onClick={onCashOut}
              className="pointer-events-auto rounded-sm border border-brass bg-gradient-to-b from-[#4a3a22] to-[#2a2014] px-3 py-1 text-[12px] sm:px-5 sm:py-3 sm:text-[1.2705rem] font-medium text-[#f0d9a0] disabled:border-brass/20 disabled:text-[#9a8b72]/50"
            >
              멈추고 정산
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 sm:block">
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1 sm:flex sm:justify-end sm:gap-2" aria-label="의식">
            {Array.from({ length: 4 }).map((_, i) => {
              const id = hand[i]
              const ritual = id ? RITUALS[id] : null
              const Icon = id ? RITUAL_ICONS[id] : null
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!ritual || inputLocked || (id === 'ash_breath' && !ashBreathAvailable)}
                  onPointerDown={(event) => { pointerType.current = event.pointerType }}
                  onClick={() => {
                    if (!id || !ritual) return
                    const key = `ritual-${id}`
                    if (pointerType.current !== 'mouse' && selected !== key) showTip(key, ritual)
                    else { onUseRitual(id); setSelected(null); setTip(null) }
                  }}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse' && ritual) {
                      setTip({
                        name: ritual.name,
                        description: ritual.description,
                      })
                    }
                  }}
                  onPointerLeave={(event) => { if (event.pointerType === 'mouse') setTip(null) }}
                  onFocus={() => {
                    if (pointerType.current === 'mouse' && ritual) {
                      setTip({
                        name: ritual.name,
                        description: ritual.description,
                      })
                    }
                  }}
                  onBlur={() => { if (pointerType.current === 'mouse') setTip(null) }}
                  aria-label={ritual?.name ?? '빈 의식 슬롯'}
                  className={`pointer-events-auto flex h-11 w-full min-w-0 items-center justify-center rounded-sm border bg-[#2c241a]/95 text-[#e8c878] disabled:opacity-35 sm:h-14 sm:w-14 ${selected === `ritual-${id}` ? 'border-wax ring-2 ring-wax/70' : 'border-brass/50'}`}
                >
                  {Icon ? <Icon className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={1.75} /> : null}
                </button>
              )
            })}
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1 sm:mt-2.5 sm:flex sm:justify-end sm:gap-1.5" aria-label="유물">
            {Array.from({ length: 4 }).map((_, i) => {
              const id = relics[i]
              const def = id ? RELICS[id] : null
              const Icon = id ? RELIC_ICONS[id] : null
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!def}
                  onClick={() => { if (id && def) showTip(`relic-${id}`, def) }}
                  className={`pointer-events-auto flex h-11 w-full min-w-0 items-center justify-center rounded-sm border bg-[#2a2218] text-[#e8c878] sm:h-10 sm:w-10 ${selected === `relic-${id}` ? 'border-wax ring-2 ring-wax/70' : 'border-brass/40'}`}
                  aria-label={def?.name ?? '빈 유물 슬롯'}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse' && def) {
                      setTip({ name: def.name, description: def.description })
                    }
                  }}
                  onPointerLeave={(event) => { if (event.pointerType === 'mouse') setTip(null) }}
                >
                  {Icon ? (
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  ) : (
                    <span className="text-[13px] text-[#9a8b72]">·</span>
                  )}
                </button>
              )
            })}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
