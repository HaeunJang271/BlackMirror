import { motion } from 'framer-motion'
import type { BossDef, GamePhase } from '../types/game'

interface OverlayScreensProps {
  phase: GamePhase
  boss: BossDef
  onStart: () => void
  onConfirmIntro: () => void
  onRetry: () => void
  onRevive: () => void
}

/**
 * 타이틀 / 인트로 / 승리 / 게임오버 오버레이.
 */
export function OverlayScreens({
  phase,
  boss,
  onStart,
  onConfirmIntro,
  onRetry,
  onRevive,
}: OverlayScreensProps) {
  if (phase === 'PLAYER_TURN' || phase === 'REWARD') return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm text-center"
      >
        {phase === 'TITLE' && (
          <>
            <p className="text-[10px] tracking-[0.35em] text-ink-muted">0시의 소환실</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl brass-text">
              검은 저울
            </h1>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              세 자루의 촛불. 황동 저울. 이름을 잃은 망자들.
              <br />
              확률을 비틀고, 배수를 터뜨려라.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="mt-8 w-full rounded-sm border border-brass py-3 text-sm tracking-wide text-brass"
            >
              자정을 연다
            </button>
          </>
        )}

        {phase === 'STAGE_INTRO' && (
          <>
            <p className="text-[10px] tracking-[0.25em] text-ink-muted">계약자 등장</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-ink">
              {boss.name}
            </h2>
            <p className="mt-3 text-sm italic text-ink-muted">“{boss.introLine}”</p>
            <p className="mt-4 rounded-sm border border-brass/30 bg-desk-lift px-3 py-2 text-xs text-brass">
              {boss.gimmickDescription}
            </p>
            <button
              type="button"
              onClick={onConfirmIntro}
              className="mt-8 w-full rounded-sm border border-brass py-3 text-sm text-brass"
            >
              저울 앞에 앉는다
            </button>
          </>
        )}

        {phase === 'VICTORY' && (
          <>
            <h2 className="font-[family-name:var(--font-display)] text-2xl brass-text">
              자정이 끝났다
            </h2>
            <p className="mt-2 text-xs text-ink-muted">세 계약자의 봉인이 모두 풀렸다.</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-8 w-full rounded-sm border border-brass py-3 text-sm text-brass"
            >
              다시 자정을 연다
            </button>
          </>
        )}

        {phase === 'GAME_OVER' && (
          <>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-curse-glow">
              촛불이 꺼졌다
            </h2>
            <p className="mt-2 text-xs text-ink-muted">어둠이 책상을 삼킨다.</p>
            <button
              type="button"
              onClick={onRevive}
              className="mt-6 w-full rounded-sm border border-curse/60 py-3 text-sm text-curse-glow"
            >
              대가를 치르고 되살리기 (1회)
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 w-full rounded-sm border border-brass/40 py-3 text-sm text-ink-muted"
            >
              타이틀로
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
