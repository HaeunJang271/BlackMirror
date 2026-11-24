import * as THREE from 'three'
import type { BossId } from '../types/game'
import { createClothTexture, texturedMat } from './materialFactory'

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

/**
 * 마디가 구분되는 마른 손.
 */
function createHand(side: 'left' | 'right'): THREE.Group {
  const hand = new THREE.Group()
  const skin = texturedMat({
    map: createClothTexture(),
    color: 0x2a2218,
    roughness: 0.88,
    bumpScale: 0.03,
  })
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.12), skin)
  palm.position.set(0, 0.02, 0)
  hand.add(palm)

  for (let i = 0; i < 4; i += 1) {
    const knuckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.018, 0.04),
      skin,
    )
    knuckle.position.set(-0.036 + i * 0.024, 0.022, -0.07)
    hand.add(knuckle)
    const tip = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.016, 0.045),
      skin,
    )
    tip.position.set(-0.036 + i * 0.024, 0.02, -0.11)
    tip.rotation.x = -0.2
    hand.add(tip)
  }
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.05), skin)
  const sign = side === 'left' ? -1 : 1
  thumb.position.set(sign * -0.06, 0.025, -0.02)
  thumb.rotation.y = sign * 0.55
  hand.add(thumb)

  hand.position.set(sign * 0.36, 0.075, -1.02)
  hand.rotation.set(-0.05, sign * 0.12, sign * 0.06)
  return hand
}

/**
 * 드레이프 망토 실루엣 — 박스 팔/어깨 없이 의자 안에 앉은 형태.
 */
export function createBoss(): BossRig {
  const group = new THREE.Group()
  const upper = new THREE.Group()
  upper.position.set(0, 0.06, -1.42)
  group.add(upper)

  const cloakMap = createClothTexture()
  cloakMap.repeat.set(2, 2)
  const cloak = texturedMat({
    map: cloakMap,
    color: 0x0a0908,
    roughness: 0.96,
    bumpScale: 0.07,
  })

  // 몸통을 감싸는 드레이프 원뿔들
  const drape = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.15, 7, 1, true),
    cloak,
  )
  drape.position.set(0, 0.55, 0.02)
  drape.rotation.x = Math.PI
  upper.add(drape)

  const foldL = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.9, 5, 1, true),
    cloak,
  )
  foldL.position.set(-0.28, 0.5, 0.08)
  foldL.rotation.set(Math.PI, 0, 0.35)
  const foldR = foldL.clone()
  foldR.position.x = 0.28
  foldR.rotation.z = -0.35
  upper.add(foldL, foldR)

  // 깊게 덮인 후드
  const hood = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.65),
    cloak,
  )
  hood.position.set(0, 1.05, -0.02)
  hood.rotation.x = 0.35
  upper.add(hood)

  const hoodCowl = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.35, 6, 1, true),
    cloak,
  )
  hoodCowl.position.set(0, 1.18, -0.04)
  hoodCowl.rotation.x = Math.PI
  upper.add(hoodCowl)

  const voidFace = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 6, 6),
    new THREE.MeshStandardMaterial({
      color: 0x020101,
      roughness: 1,
      flatShading: true,
    }),
  )
  voidFace.position.set(0, 0.98, 0.1)
  upper.add(voidFace)

  const maskGroup = new THREE.Group()
  maskGroup.position.set(0, 0.98, 0.16)
  upper.add(maskGroup)

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    emissive: 0xc5a059,
    emissiveIntensity: 2.6,
    flatShading: true,
  })
  const leftEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.009, 0.012),
    eyeMat,
  )
  const rightEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.009, 0.012),
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

  let hitUntil = 0
  let nodUntil = 0
  const handBase = {
    left: leftHand.position.clone(),
    right: rightHand.position.clone(),
  }

  function clearAccessory() {
    while (accessory.children.length > 0) accessory.remove(accessory.children[0]!)
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
      accessory.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.18, 0.02),
          new THREE.MeshStandardMaterial({
            color: 0xb8954a,
            metalness: 0.7,
            roughness: 0.4,
            flatShading: true,
          }),
        ),
      )
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
      accessory.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(0.17, 0.2, 0.015),
          new THREE.MeshStandardMaterial({
            color: pale,
            roughness: 0.45,
            flatShading: true,
          }),
        ),
      )
      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.18, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x8b1e1e, flatShading: true }),
      )
      crack.position.set(0.02, 0, 0.02)
      crack.rotation.z = 0.18
      accessory.add(crack)
    } else {
      applyEyes(curse)
      accessory.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.16, 0.02),
          new THREE.MeshStandardMaterial({
            color: 0x2a1810,
            roughness: 0.7,
            flatShading: true,
          }),
        ),
      )
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 5), cloak)
      const l = horn.clone()
      const r = horn.clone()
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
      upper.position.y = 0.06 + Math.sin(t * 1.35) * 0.018

      if (t < hitUntil) {
        const k = (hitUntil - t) / 0.55
        upper.rotation.x = -0.32 * k
        upper.position.z = -1.42 - 0.1 * k
        leftHand.position.y = handBase.left.y + 0.06 * k
        rightHand.position.y = handBase.right.y + 0.06 * k
        leftHand.position.z = handBase.left.z - 0.05 * k
        rightHand.position.z = handBase.right.z - 0.05 * k
      } else if (t < nodUntil) {
        const k = Math.sin(((nodUntil - t) / 0.7) * Math.PI)
        upper.rotation.x = 0.22 * k
        upper.position.z = -1.42
        leftHand.position.lerp(handBase.left, 0.2)
        rightHand.position.lerp(handBase.right, 0.2)
      } else {
        upper.rotation.x = THREE.MathUtils.lerp(upper.rotation.x, 0, 0.08)
        upper.position.z = THREE.MathUtils.lerp(upper.position.z, -1.42, 0.08)
        leftHand.position.lerp(handBase.left, 0.1)
        rightHand.position.lerp(handBase.right, 0.1)
      }
    },
  }
}
