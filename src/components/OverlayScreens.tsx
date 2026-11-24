import { motion } from 'framer-motion'
import type { BossDef, GamePhase } from '../types/game'

interface OverlayScreensProps {
  phase: GamePhase
  boss: BossDef
  onStart: () => void
  onEnableAudio: () => void
  onPlayMusic: () => void
  onConfirmIntro: () => void
  onRetry: () => void
  onRevive: () => void
  hasUsedRevive: boolean
  adBusy: boolean
  adError: string | null
  freeRevive: boolean
}

/**
 * 타이틀 / 인트로 / 승리 / 게임오버 오버레이.
 */
export function OverlayScreens({
  phase,
  boss,
  onStart,
  onEnableAudio,
  onConfirmIntro,
  onRetry,
  onRevive,
  hasUsedRevive,
  adBusy,
  adError,
  freeRevive,
}: OverlayScreensProps) {
  if (phase === 'PLAYER_TURN' || phase === 'RESOLVING' || phase === 'REWARD') {
    return null
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 px-6"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onPointerDown={phase === 'TITLE' ? onEnableAudio : undefined}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm text-center"
      >
        {phase === 'TITLE' && (
          <>
            <p className="text-[12.1px] tracking-[0.35em] text-ink-muted">자정의 소환실</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl brass-text">
              검은 저울
            </h1>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              자정이 울리면 책상 위 촛불 세 자루에 네 영혼이 묶인다.
              <br />
              거짓을 피해 진실의 무게로, 이름 잃은 세 망자의 봉인을 부숴라.
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
            <p className="text-[12.1px] tracking-[0.25em] text-ink-muted">계약자 등장</p>
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
              봉인이 깨졌다
            </h2>
            <p className="mt-2 text-xs text-ink-muted">새벽 0시 01분, 세 망자가 물러가고 문이 열렸다. 문 밖으로 한 걸음 내딛는 순간, 등 뒤에서 익숙한 황동 저울 소리가 다시 울린다.</p>
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
              마지막 불씨가 꺼졌다
            </h2>
            <p className="mt-2 text-xs text-ink-muted">자정의 소환실에 네 이름이 하나 더 새겨졌다. 저울은 다음 자정을 기다린다.</p>
            {!hasUsedRevive && (
              <button
                type="button"
                onClick={onRevive}
                disabled={adBusy}
                className="mt-6 w-full rounded-sm border border-curse/60 py-3 text-sm text-curse-glow disabled:opacity-50"
              >
                {freeRevive ? '🕯 촛불 1개 되살리기' : '🕯 광고 보고 촛불 1개 되살리기'}
              </button>
            )}
            {adError && <p role="alert" className="mt-3 text-xs text-curse-glow">{adError}</p>}
            <button
              type="button"
              onClick={onRetry}
              disabled={adBusy}
              className="mt-2 w-full rounded-sm border border-brass/40 py-3 text-sm text-ink-muted"
            >
              처음부터 다시 하기
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
