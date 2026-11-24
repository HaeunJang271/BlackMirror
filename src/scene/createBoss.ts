import * as THREE from 'three'
import type { BossId } from '../types/game'

export interface BossRig {
  group: THREE.Group
  /**
   * 보스 종류에 맞춰 가면·악세서리를 교체한다.
   */
  setBoss: (id: BossId) => void
  /**
   * 숨결·피격(상체+양손)·끄덕임 애니메이션.
   */
  update: (t: number, opts: { hit: boolean; nod: boolean }) => void
}

function cloakMat(color = 0x0b0908): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.96,
    metalness: 0.02,
    flatShading: true,
  })
}

/**
 * 마른 손바닥 + 손가락 실루엣.
 */
function createHand(side: 'left' | 'right'): THREE.Group {
  const hand = new THREE.Group()
  const skin = cloakMat(0x1a1612)
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.14), skin)
  palm.position.set(0, 0.02, 0)
  hand.add(palm)

  for (let i = 0; i < 4; i += 1) {
    const finger = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.022, 0.09),
      skin,
    )
    finger.position.set(-0.04 + i * 0.028, 0.02, -0.1)
    finger.rotation.x = -0.15 - i * 0.03
    hand.add(finger)
  }
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.06), skin)
  thumb.position.set(side === 'left' ? 0.07 : -0.07, 0.025, -0.02)
  thumb.rotation.y = side === 'left' ? -0.6 : 0.6
  hand.add(thumb)

  const sign = side === 'left' ? -1 : 1
  hand.position.set(sign * 0.38, 0.075, -1.02)
  hand.rotation.set(-0.05, sign * 0.15, sign * 0.08)
  return hand
}

/**
 * 인스크립션/벅샷 감성 — 각진 후드 실루엣 + 책상 위 양손.
 */
export function createBoss(): BossRig {
  const group = new THREE.Group()
  group.position.set(0, 0, 0)

  const upper = new THREE.Group()
  upper.position.set(0, 0.06, -1.42)
  group.add(upper)

  const cloak = cloakMat()
  const shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.22, 0.38),
    cloak,
  )
  shoulder.position.set(0, 0.72, 0.02)
  upper.add(shoulder)

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.34, 0.55, 5, 1, false),
    cloak,
  )
  torso.position.set(0, 0.42, 0.04)
  upper.add(torso)

  // 깊게 덮인 각진 후드
  const hood = new THREE.Mesh(
    new THREE.ConeGeometry(0.36, 0.42, 6, 1, true),
    cloakMat(0x090807),
  )
  hood.position.set(0, 1.12, -0.02)
  hood.rotation.x = Math.PI
  upper.add(hood)

  const hoodRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.3, 0.12, 6, 1, true),
    cloakMat(0x050403),
  )
  hoodRim.position.set(0, 0.98, 0.06)
  hoodRim.rotation.x = 0.35
  upper.add(hoodRim)

  // 후드 안쪽 그림자 체적
  const voidFace = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.2, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x020101,
      roughness: 1,
      flatShading: true,
    }),
  )
  voidFace.position.set(0, 0.98, 0.12)
  upper.add(voidFace)

  const maskGroup = new THREE.Group()
  maskGroup.position.set(0, 0.98, 0.16)
  upper.add(maskGroup)

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    emissive: 0xc5a059,
    emissiveIntensity: 2.4,
    flatShading: true,
  })
  const leftEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.01, 0.012),
    eyeMat,
  )
  const rightEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.01, 0.012),
    eyeMat.clone(),
  )
  leftEye.position.set(-0.045, 0.02, 0.04)
  rightEye.position.set(0.045, 0.02, 0.04)
  maskGroup.add(leftEye, rightEye)

  const accessory = new THREE.Group()
  maskGroup.add(accessory)

  const leftHand = createHand('left')
  const rightHand = createHand('right')
  group.add(leftHand, rightHand)

  // 팔뚝이 어깨에서 손으로 이어지는 실루엣
  const armMat = cloakMat(0x0c0a08)
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.42),
    armMat,
  )
  leftArm.position.set(-0.42, 0.42, -1.2)
  leftArm.rotation.set(0.55, 0.1, 0.35)
  const rightArm = leftArm.clone()
  rightArm.position.set(0.42, 0.42, -1.2)
  rightArm.rotation.set(0.55, -0.1, -0.35)
  group.add(leftArm, rightArm)

  let hitUntil = 0
  let nodUntil = 0
  const handBase = {
    left: leftHand.position.clone(),
    right: rightHand.position.clone(),
  }

  function clearAccessory() {
    while (accessory.children.length > 0) {
      accessory.remove(accessory.children[0]!)
    }
  }

  function buildMask(id: BossId) {
    clearAccessory()
    leftEye.visible = true
    rightEye.visible = true

    const brass = new THREE.Color(0xc5a059)
    const pale = new THREE.Color(0xd8d0c4)
    const curse = new THREE.Color(0x8b1e1e)
    const applyEyes = (c: THREE.Color) => {
      eyeMat.color.copy(c)
      eyeMat.emissive.copy(c)
      const rm = rightEye.material as THREE.MeshStandardMaterial
      rm.color.copy(c)
      rm.emissive.copy(c)
    }

    if (id === 'blind_clockmaker') {
      applyEyes(brass)
      const mask = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.18, 0.02),
        new THREE.MeshStandardMaterial({
          color: 0xb8954a,
          metalness: 0.7,
          roughness: 0.4,
          flatShading: true,
        }),
      )
      accessory.add(mask)
      const patch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.025, 6),
        new THREE.MeshStandardMaterial({
          color: 0xc5a059,
          metalness: 0.85,
          roughness: 0.3,
          flatShading: true,
        }),
      )
      patch.rotation.x = Math.PI / 2
      patch.position.set(-0.045, 0.02, 0.03)
      accessory.add(patch)
      leftEye.visible = false
    } else if (id === 'mirror_priest') {
      applyEyes(brass)
      const mask = new THREE.Mesh(
        new THREE.BoxGeometry(0.17, 0.2, 0.015),
        new THREE.MeshStandardMaterial({
          color: pale,
          roughness: 0.45,
          flatShading: true,
        }),
      )
      accessory.add(mask)
      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.18, 0.01),
        new THREE.MeshStandardMaterial({
          color: 0x8b1e1e,
          flatShading: true,
        }),
      )
      crack.position.set(0.02, 0, 0.02)
      crack.rotation.z = 0.18
      accessory.add(crack)
    } else {
      applyEyes(curse)
      const mask = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.16, 0.02),
        new THREE.MeshStandardMaterial({
          color: 0x2a1810,
          roughness: 0.7,
          flatShading: true,
        }),
      )
      accessory.add(mask)
      const hornMat = cloakMat(0x12100c)
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 5), hornMat)
      const r = l.clone()
      l.position.set(-0.12, 0.22, -0.04)
      r.position.set(0.12, 0.22, -0.04)
      l.rotation.z = 0.4
      r.rotation.z = -0.4
      accessory.add(l, r)
    }
  }

  buildMask('blind_clockmaker')

  return {
    group,
    setBoss: buildMask,
    update(t, opts) {
      if (opts.hit) hitUntil = t + 0.55
      if (opts.nod) nodUntil = t + 0.7

      const breath = Math.sin(t * 1.35) * 0.018
      upper.position.y = 0.06 + breath

      if (t < hitUntil) {
        const k = (hitUntil - t) / 0.55
        upper.rotation.x = -0.32 * k
        upper.position.z = -1.42 - 0.1 * k
        // 피격 시 양손이 책상에서 살짝 들리며 뒤로
        leftHand.position.y = handBase.left.y + 0.06 * k
        rightHand.position.y = handBase.right.y + 0.06 * k
        leftHand.position.z = handBase.left.z - 0.05 * k
        rightHand.position.z = handBase.right.z - 0.05 * k
        leftHand.rotation.x = -0.05 - 0.25 * k
        rightHand.rotation.x = -0.05 - 0.25 * k
      } else if (t < nodUntil) {
        const k = Math.sin(((nodUntil - t) / 0.7) * Math.PI)
        upper.rotation.x = 0.22 * k
        upper.position.z = -1.42
        leftHand.position.y = handBase.left.y
        rightHand.position.y = handBase.right.y
        leftHand.position.lerp(handBase.left, 0.2)
        rightHand.position.lerp(handBase.right, 0.2)
      } else {
        upper.rotation.x = THREE.MathUtils.lerp(upper.rotation.x, 0, 0.08)
        upper.position.z = THREE.MathUtils.lerp(upper.position.z, -1.42, 0.08)
        leftHand.position.lerp(handBase.left, 0.1)
        rightHand.position.lerp(handBase.right, 0.1)
        leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, -0.05, 0.1)
        rightHand.rotation.x = THREE.MathUtils.lerp(
          rightHand.rotation.x,
          -0.05,
          0.1,
        )
      }
    },
  }
}
