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
})
