import { getBoss } from '../data/bosses'
import type { BoardCard, CardFace, RelicId } from '../types/game'
import { createRng, shuffleInPlace } from '../utils/rng'

/**
 * 보스 비율 + 녹슨 저울추를 반영한 중앙 판 5장을 생성한다.
 */
export function buildBoard(
  stageIndex: number,
  relics: RelicId[],
  seed: number,
  round: number,
): BoardCard[] {
  const boss = getBoss(stageIndex)
  let truthCount = boss.truthCount
  let curseCount = boss.curseCount

  if (relics.includes('rusty_weight')) {
    truthCount = Math.max(1, truthCount - 1)
    curseCount += 1
  }

  const total = truthCount + curseCount
  if (total !== 5) {
    // 비율 보정: 항상 5장 유지
    const diff = 5 - total
    if (diff > 0) truthCount += diff
    else curseCount = Math.max(1, curseCount + diff)
  }

  const faces: CardFace[] = [
    ...Array.from({ length: truthCount }, () => 'truth' as const),
    ...Array.from({ length: curseCount }, () => 'curse' as const),
  ]

  const rand = createRng(seed + stageIndex * 1009 + round * 17)
  shuffleInPlace(faces, rand)

  const board: BoardCard[] = faces.map((face, i) => ({
    id: `c-${stageIndex}-${round}-${i}`,
    face,
    peeked: false,
    revealed: false,
    fakeHint: false,
    removed: false,
  }))

  // 거울 성직자: 미공개 저주 1장에 가짜 암시
  if (boss.id === 'mirror_priest') {
    const curse = board.find((c) => c.face === 'curse')
    if (curse) curse.fakeHint = true
  }

  return board
}

/**
 * 아직 열리지 않은(그리고 제거되지 않은) 저주 카드 하나를 제거한다.
 */
export function removeOneUnopenedCurse(board: BoardCard[]): BoardCard[] {
  const idx = board.findIndex(
    (c) => !c.revealed && !c.removed && c.face === 'curse',
  )
  if (idx < 0) return board
  return board.map((c, i) => (i === idx ? { ...c, removed: true } : c))
}
