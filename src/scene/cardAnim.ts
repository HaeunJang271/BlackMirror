import type { CardMesh } from './createCards'

export const REST_Y = 0.03
export const FLIP_HEIGHT = 0.48

/**
 * 테이블 관통 없이: 들어올리고 → 공중에서 뒤집고 → 내린다.
 */
export function applyFlipPose(card: CardMesh, p: number): void {
  let lift = REST_Y
  let spin = 0
  if (p <= 0) {
    lift = REST_Y
    spin = 0
  } else if (p < 0.28) {
    const t = p / 0.28
    lift = REST_Y + t * (FLIP_HEIGHT - REST_Y)
  } else if (p < 0.72) {
    const t = (p - 0.28) / 0.44
    lift = FLIP_HEIGHT
    spin = Math.PI * t
  } else if (p < 1) {
    const t = (p - 0.72) / 0.28
    lift = FLIP_HEIGHT + (REST_Y - FLIP_HEIGHT) * t
    spin = Math.PI
  } else {
    lift = REST_Y
    spin = Math.PI
  }
  card.group.position.y = lift
  card.flipRoot.rotation.x = spin
}

/**
 * 투시 열기/유지/닫기 한 프레임을 진행한다. 끝나면 true.
 */
export function stepPeek(card: CardMesh): boolean {
  if (card.peekPhase === 'open') {
    card.peekT = Math.min(1, card.peekT + 0.05)
    applyFlipPose(card, card.peekT)
    if (card.peekT >= 1) {
      card.peekPhase = 'hold'
      card.peekT = 0
    }
    return false
  }
  if (card.peekPhase === 'hold') {
    card.peekT += 0.016
    applyFlipPose(card, 1)
    if (card.peekT >= 1.35) {
      card.peekPhase = 'close'
      card.peekT = 1
    }
    return false
  }
  if (card.peekPhase === 'close') {
    card.peekT = Math.max(0, card.peekT - 0.05)
    applyFlipPose(card, card.peekT)
    if (card.peekT <= 0) {
      card.peekPhase = 'none'
      card.flipRoot.rotation.x = 0
      card.group.position.y = REST_Y
      return true
    }
  }
  return false
}
