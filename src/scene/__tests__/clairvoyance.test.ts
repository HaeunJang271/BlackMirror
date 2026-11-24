import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import type { BoardCard } from '../../types/game'

vi.mock('../textures', () => ({
  createCardBackTexture: () => new THREE.Texture(),
  createTruthFaceTexture: () => new THREE.Texture(),
  createCurseFaceTexture: () => new THREE.Texture(),
}))

import { createCards } from '../createCards'

describe('투시의 은화', () => {
  it('진실과 저주 패 각각의 앞면을 잠시 보여주고 다시 덮는다', () => {
    const rig = createCards()
    const board: BoardCard[] = (['truth', 'curse'] as const).map((face) => ({
      id: face, face, peeked: false, revealed: false, fakeHint: false, removed: false,
    }))
    rig.syncBoard(board)
    const [truth, curse] = rig.cards
    expect((truth!.mesh.material as THREE.MeshStandardMaterial[])[5]!.map)
      .not.toBe((curse!.mesh.material as THREE.MeshStandardMaterial[])[5]!.map)

    for (const card of [truth!, curse!]) {
      rig.playClairvoyance(card.id)
      for (let i = 0; i < 25; i += 1) rig.update(0, null)
      expect(card.flipRoot.rotation.x).toBeCloseTo(Math.PI)
      expect(card.revealed).toBe(false)
      rig.syncBoard(board)
      expect(card.flipRoot.rotation.x).toBeCloseTo(Math.PI)
      for (let i = 0; i < 110; i += 1) rig.update(0, null)
      expect(card.flipRoot.rotation.x).toBeCloseTo(0)
      expect(card.peekPhase).toBe('none')
    }
  })

  it('덮인 선택 패만 떠오르고 테두리가 빛나며 제거된 패에는 재가 생긴다', () => {
    const rig = createCards()
    const board: BoardCard[] = [
      { id: 'one', face: 'curse', peeked: false, revealed: false, fakeHint: false, removed: false },
      { id: 'two', face: 'truth', peeked: false, revealed: false, fakeHint: false, removed: false },
    ]
    rig.syncBoard(board)
    for (let i = 0; i < 20; i += 1) rig.update(i / 60, 'one')
    expect(rig.cards[0]!.group.position.y).toBeGreaterThan(rig.cards[1]!.group.position.y)
    expect(rig.cards[0]!.highlightMaterial.emissiveIntensity).toBeGreaterThan(1)
    expect(rig.cards[1]!.highlightMaterial.emissiveIntensity).toBe(0)
    rig.syncBoard([{ ...board[0]!, removed: true }, board[1]!])
    const particles = rig.group.children.filter((item) => item instanceof THREE.Points)
    expect(particles).toHaveLength(1)
    rig.syncBoard([{ ...board[0]!, id: 'new-round' }, board[1]!])
    expect(rig.cards[0]!.vanishing).toBe(false)
    expect(rig.cards[0]!.group.visible).toBe(true)
    rig.update(1, null)
    rig.update(2, null)
    expect(rig.group.children.filter((item) => item instanceof THREE.Points)).toHaveLength(0)
  })
})
