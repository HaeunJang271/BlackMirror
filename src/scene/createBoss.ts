import * as THREE from 'three'
import type { BossId } from '../types/game'

export interface BossRig {
  group: THREE.Group
  /**
   * 보스 종류에 맞춰 악세서리를 교체한다.
   */
  setBoss: (id: BossId) => void
  /**
   * 숨결·피격·끄덕임 애니메이션.
   */
  update: (
    t: number,
    opts: { hit: boolean; nod: boolean },
  ) => void
}

/**
 * 맞은편 상체 실루엣 보스를 생성한다.
 */
export function createBoss(): BossRig {
  const group = new THREE.Group()
  group.position.set(0, 0.55, -1.55)

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.55, 4, 10),
    new THREE.MeshStandardMaterial({ color: 0x0a0908, roughness: 0.95 }),
  )
  torso.position.y = 0.45
  group.add(torso)

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x12100e, roughness: 0.9 }),
  )
  head.position.y = 0.95
  group.add(head)

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    emissive: 0xc5a059,
    emissiveIntensity: 1.8,
  })
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat)
  const rightEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    eyeMat.clone(),
  )
  leftEye.position.set(-0.07, 0.98, 0.16)
  rightEye.position.set(0.07, 0.98, 0.16)
  group.add(leftEye, rightEye)

  const accessory = new THREE.Group()
  group.add(accessory)

  let hitUntil = 0
  let nodUntil = 0
  let baseY = group.position.y

  function clearAccessory() {
    while (accessory.children.length > 0) {
      accessory.remove(accessory.children[0]!)
    }
  }

  function setBoss(id: BossId) {
    clearAccessory()
    leftEye.visible = true
    rightEye.visible = true
    const brassEye = new THREE.Color(0xc5a059)
    const curseEye = new THREE.Color(0x8b1e1e)
    const applyEye = (color: THREE.Color) => {
      eyeMat.color.copy(color)
      eyeMat.emissive.copy(color)
      const rightMat = rightEye.material as THREE.MeshStandardMaterial
      rightMat.color.copy(color)
      rightMat.emissive.copy(color)
    }
    applyEye(brassEye)
    if (id === 'blind_clockmaker') {
      // 황동 시계 안대
      const patch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.03, 16),
        new THREE.MeshStandardMaterial({
          color: 0xc5a059,
          metalness: 0.85,
          roughness: 0.35,
        }),
      )
      patch.rotation.x = Math.PI / 2
      patch.position.set(-0.07, 0.98, 0.18)
      accessory.add(patch)
      leftEye.visible = false
    } else if (id === 'mirror_priest') {
      const mask = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.34),
        new THREE.MeshStandardMaterial({
          color: 0xe8e0d4,
          roughness: 0.4,
          side: THREE.DoubleSide,
        }),
      )
      mask.position.set(0, 0.96, 0.19)
      accessory.add(mask)
      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.28, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x8b1e1e }),
      )
      crack.position.set(0.02, 0.96, 0.2)
      crack.rotation.z = 0.2
      accessory.add(crack)
    } else {
      // 어두운 뿔
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x1a1210 })
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 8), hornMat)
      const r = l.clone()
      l.position.set(-0.14, 1.18, 0)
      r.position.set(0.14, 1.18, 0)
      l.rotation.z = 0.35
      r.rotation.z = -0.35
      accessory.add(l, r)
      applyEye(curseEye)
    }
  }

  setBoss('blind_clockmaker')

  return {
    group,
    setBoss,
    update(t, opts) {
      if (opts.hit) hitUntil = t + 0.55
      if (opts.nod) nodUntil = t + 0.7

      const breath = Math.sin(t * 1.4) * 0.025
      group.position.y = baseY + breath

      if (t < hitUntil) {
        const k = (hitUntil - t) / 0.55
        group.rotation.x = -0.35 * k
        group.position.z = -1.55 - 0.12 * k
      } else if (t < nodUntil) {
        const k = Math.sin(((nodUntil - t) / 0.7) * Math.PI)
        group.rotation.x = 0.28 * k
        group.position.z = -1.55
      } else {
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0, 0.08)
        group.position.z = THREE.MathUtils.lerp(group.position.z, -1.55, 0.08)
      }
    },
  }
}
