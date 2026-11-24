import { useEffect, useRef } from 'react'
import type { BoardCard, BossId } from '../types/game'
import { SceneController } from '../scene/SceneController'
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
  onCardClick: (cardId: string) => void
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
  onCardClick,
}: TableSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controllerRef = useRef<SceneController | null>(null)
  const clickRef = useRef(onCardClick)
  clickRef.current = onCardClick

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
    return () => {
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
  ])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-[100dvh] w-screen touch-none"
      aria-label="검은 저울 테이블"
    />
  )
}
