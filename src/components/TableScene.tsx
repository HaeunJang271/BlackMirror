import { useEffect, useRef } from 'react'
import type { BoardCard, BossId, RitualId } from '../types/game'
import { SceneController } from '../scene/SceneController'
import type { RitualFxCue } from '../scene/ritualFx'
import { log } from '../utils/logger'

interface TableSceneProps {
  board: BoardCard[]
  candles: number
  bossId: BossId
  expectedDamage: number
  multiplier: number
  interactive: boolean
  hit: boolean
  nod: boolean
  saltActive: boolean
  bloodActive: boolean
  saltBreak: boolean
  ritualCue: RitualFxCue | null
  onCardClick: (cardId: string) => void
  onBloodPulse?: (pulse: number) => void
}

/**
 * 1인칭 3D 테이블 캔버스. 엔진 상태는 props로만 받는다.
 */
export function TableScene({
  board,
  candles,
  bossId,
  expectedDamage,
  multiplier,
  interactive,
  hit,
  nod,
  saltActive,
  bloodActive,
  saltBreak,
  ritualCue,
  onCardClick,
  onBloodPulse,
}: TableSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controllerRef = useRef<SceneController | null>(null)
  const clickRef = useRef(onCardClick)
  const pulseRef = useRef(onBloodPulse)
  clickRef.current = onCardClick
  pulseRef.current = onBloodPulse

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let controller: SceneController
    try {
      controller = new SceneController(canvas)
    } catch (err) {
      log('error', 'Failed to init TableScene', err)
      throw err
    }
    controller.setCardClickHandler((id) => clickRef.current(id))
    controllerRef.current = controller

    let raf = 0
    const poll = () => {
      pulseRef.current?.(controller.getBloodPulse())
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)

    return () => {
      cancelAnimationFrame(raf)
      controller.dispose()
      controllerRef.current = null
    }
  }, [])

  useEffect(() => {
    controllerRef.current?.sync({
      board,
      candles,
      bossId,
      expectedDamage,
      multiplier,
      interactive,
      hit,
      nod,
      saltActive,
      bloodActive,
      saltBreak,
      ritualCue,
    })
  }, [
    board,
    candles,
    bossId,
    expectedDamage,
    multiplier,
    interactive,
    hit,
    nod,
    saltActive,
    bloodActive,
    saltBreak,
    ritualCue,
  ])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-[100dvh] w-screen touch-none"
      aria-label="검은 저울 테이블"
    />
  )
}

export type { RitualId }
