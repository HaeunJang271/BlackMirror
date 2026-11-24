import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'

vi.mock('../bossPortraits', () => ({
  preloadBossPortraits: () => ({
    blind_clockmaker: new THREE.Texture(), mirror_priest: new THREE.Texture(), scale_master: new THREE.Texture(),
  }),
}))

import { createBoss } from '../createBoss'

describe('보스 연출', () => {
  it('숨을 쉬고 피격 후 잠시 빛나며 원래 상태로 돌아온다', () => {
    const boss = createBoss()
    const upper = boss.group.children[0] as THREE.Group
    const portrait = upper.children[0] as THREE.Mesh
    const flash = portrait.children[0] as THREE.Mesh
    const flashMaterial = flash.material as THREE.MeshBasicMaterial
    boss.update(0, { hit: false, nod: false, lastCandle: false })
    const startY = upper.position.y
    for (let i = 1; i <= 5; i += 1) boss.update(i * 0.1, { hit: false, nod: false, lastCandle: false })
    expect(upper.position.y).toBeGreaterThan(startY)
    expect(portrait.scale.y).toBeGreaterThan(1)
    boss.update(0.6, { hit: true, nod: false, lastCandle: false })
    expect(flashMaterial.opacity).toBeGreaterThan(0)
    boss.update(1, { hit: false, nod: false, lastCandle: false })
    expect(flashMaterial.opacity).toBe(0)
  })
})
