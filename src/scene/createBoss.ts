import * as THREE from 'three'
import type { BossId } from '../types/game'
import { createBossSignature } from './bossSignatures'
import { createClothTexture, texturedMat } from './materialFactory'

export interface BossRig {
  group: THREE.Group
  /** 보스 종류에 맞춰 가면·악세서리를 교체한다. */
  setBoss: (id: BossId) => void
  /** 숨결·피격(상체+양손)·끄덕임·시그니처 회전. */
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
 * 단일 실루엣 보스 — 열린 콘/겹 주름 없이 몸통·후드·얼굴 레이어만.
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
  cloak.side = THREE.FrontSide

  // 닫힌 몸통 (openEnded 금지 — 안쪽 면이 비치면 겹쳐 보임)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.48, 1.05, 8),
    cloak,
  )
  body.position.set(0, 0.52, 0)
  upper.add(body)

  // 어깨
  const shoulders = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
    cloak,
  )
  shoulders.position.set(0, 0.95, 0)
  upper.add(shoulders)

  // 후드 — 뒤쪽만 (phiStart로 앞 개방)
  const hood = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.24,
      10,
      8,
      Math.PI * 0.55,
      Math.PI * 1.1,
      0,
      Math.PI * 0.72,
    ),
    cloak,
  )
  hood.position.set(0, 1.08, -0.02)
  upper.add(hood)

  // 얼굴 어두운 받침 (가면 바로 뒤, 작게)
  const voidFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 12),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 1,
      flatShading: true,
    }),
  )
  voidFace.position.set(0, 1.05, 0.16)
  upper.add(voidFace)

  // 시그니처는 voidFace 앞 — 몸통과 절대 교차하지 않는 z
  const maskGroup = new THREE.Group()
  maskGroup.position.set(0, 1.05, 0.18)
  upper.add(maskGroup)

  const faceLight = new THREE.PointLight(0xc5a059, 1.0, 2.0, 2)
  faceLight.position.set(0, 0.02, 0.22)
  maskGroup.add(faceLight)

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
  leftEye.position.set(-0.045, 0.02, 0.02)
  rightEye.position.set(0.045, 0.02, 0.02)
  maskGroup.add(leftEye, rightEye)

  const accessory = new THREE.Group()
  maskGroup.add(accessory)

  const leftHand = createHand('left')
  const rightHand = createHand('right')
  group.add(leftHand, rightHand)

  let hitUntil = 0
  let nodUntil = 0
  let spinners: THREE.Object3D[] = []
  const handBase = {
    left: leftHand.position.clone(),
    right: rightHand.position.clone(),
  }

  function clearAccessory() {
    while (accessory.children.length > 0) {
      accessory.remove(accessory.children[0]!)
    }
    spinners = []
  }

  function buildMask(id: BossId) {
    clearAccessory()
    const sig = createBossSignature(id)
    accessory.add(sig.root)
    spinners = sig.spinners
    leftEye.visible = !sig.hideLeftEye
    rightEye.visible = !sig.hideRightEye
    eyeMat.color.copy(sig.eyeColor)
    eyeMat.emissive.copy(sig.eyeColor)
    eyeMat.emissiveIntensity = id === 'scale_master' ? 3.4 : 2.6
    const rm = rightEye.material as THREE.MeshStandardMaterial
    rm.color.copy(sig.eyeColor)
    rm.emissive.copy(sig.eyeColor)
    rm.emissiveIntensity = eyeMat.emissiveIntensity
    faceLight.color.setHex(sig.faceLightColor)
    faceLight.intensity = sig.faceLightIntensity
  }

  buildMask('blind_clockmaker')

  return {
    group,
    setBoss: buildMask,
    update(t, opts) {
      if (opts.hit) hitUntil = t + 0.55
      if (opts.nod) nodUntil = t + 0.7
      upper.position.y = 0.06 + Math.sin(t * 1.35) * 0.018

      spinners.forEach((s, i) => {
        s.rotation.z += i === 0 ? 0.005 : 0.012 + i * 0.003
      })

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
