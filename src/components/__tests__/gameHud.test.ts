import { describe, expect, it } from 'vitest'
import type { BoardCard } from '../../types/game'
import { countRemainingFaces } from '../../utils/boardStats'

function card(partial: Partial<BoardCard> & Pick<BoardCard, 'face'>): BoardCard {
  return {
    id: partial.id ?? 'c',
    face: partial.face,
    peeked: false,
    revealed: partial.revealed ?? false,
    fakeHint: false,
    removed: partial.removed ?? false,
  }
}

describe('countRemainingFaces', () => {
  it('미공개 진실/저주만 센다', () => {
    const board = [
      card({ face: 'truth' }),
      card({ face: 'truth', revealed: true }),
      card({ face: 'curse' }),
      card({ face: 'curse', removed: true }),
      card({ face: 'truth' }),
    ]
    expect(countRemainingFaces(board)).toEqual({ truth: 2, curse: 1 })
  })
})
