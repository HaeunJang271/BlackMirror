import { describe, expect, it } from 'vitest'
import { buildBoard, removeOneUnopenedCurse } from '../board'

describe('buildBoard', () => {
  it('기본 스테이지1은 진실3 저주2다', () => {
    const board = buildBoard(0, [], 1, 1)
    expect(board).toHaveLength(5)
    expect(board.filter((c) => c.face === 'truth')).toHaveLength(3)
    expect(board.filter((c) => c.face === 'curse')).toHaveLength(2)
  })

  it('녹슨 저울추는 저주 +1 (진실 -1)을 적용한다', () => {
    const board = buildBoard(0, ['rusty_weight'], 1, 1)
    expect(board.filter((c) => c.face === 'curse')).toHaveLength(3)
    expect(board.filter((c) => c.face === 'truth')).toHaveLength(2)
  })

  it('거울 성직자는 저주 1장에 가짜 암시를 붙인다', () => {
    const board = buildBoard(1, [], 99, 1)
    expect(board.some((c) => c.face === 'curse' && c.fakeHint)).toBe(true)
  })
})

describe('removeOneUnopenedCurse', () => {
  it('미공개 저주 1장을 제거한다', () => {
    const board = buildBoard(0, [], 3, 1)
    const next = removeOneUnopenedCurse(board)
    expect(next.filter((c) => c.removed)).toHaveLength(1)
    expect(next.find((c) => c.removed)?.face).toBe('curse')
  })
})
