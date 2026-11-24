import type { BoardCard } from '../types/game'

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
