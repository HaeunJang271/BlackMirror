import * as THREE from 'three'
import type { BossId } from '../types/game'

export interface BossSignature {
  root: THREE.Group
  spinners: THREE.Object3D[]
  hideLeftEye: boolean
  hideRightEye: boolean
  eyeColor: THREE.Color
  faceLightColor: number
  faceLightIntensity: number
}

/**
 * 보스별 시그니처 — 얼굴 앞면(z≥0)에만 얇게 배치.
 */
export function createBossSignature(id: BossId): BossSignature {
  if (id === 'blind_clockmaker') return buildClockmaker()
  if (id === 'mirror_priest') return buildPriest()
  return buildScaleMaster()
}

function brassMat(
  emissiveHex = 0xc5a059,
  intensity = 1.6,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xb8954a,
    emissive: new THREE.Color(emissiveHex),
    emissiveIntensity: intensity,
    metalness: 0.85,
    roughness: 0.32,
    flatShading: true,
    depthWrite: true,
  })
}

/** 1스테이지 — 시계 가면 + 옆 소형 톱니(몸 밖). */
function buildClockmaker(): BossSignature {
  const root = new THREE.Group()
  const spinners: THREE.Object3D[] = []

  const faceDisk = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 20),
    brassMat(0xc5a059, 1.4),
  )
  faceDisk.position.set(0, 0.02, 0.01)
  root.add(faceDisk)

  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.125, 20),
    brassMat(0xe8a856, 1.8),
  )
  rim.position.set(0, 0.02, 0.012)
  root.add(rim)
  spinners.push(rim)

  const patch = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 16),
    brassMat(0xe8a856, 2.8),
  )
  patch.position.set(-0.04, 0.03, 0.02)
  root.add(patch)

  const dial = new THREE.Mesh(
    new THREE.CircleGeometry(0.028, 14),
    new THREE.MeshStandardMaterial({
      color: 0x1a1208,
      emissive: 0xc5a059,
      emissiveIntensity: 2.0,
      flatShading: true,
    }),
  )
  dial.position.set(-0.04, 0.03, 0.025)
  root.add(dial)

  const hand = new THREE.Mesh(
    new THREE.BoxGeometry(0.007, 0.024, 0.004),
    brassMat(0xffd78a, 3),
  )
  hand.position.set(-0.04, 0.038, 0.03)
  root.add(hand)
  spinners.push(hand)

  const slit = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.01, 0.008),
    brassMat(0xe8a856, 3.2),
  )
  slit.position.set(0.045, 0.025, 0.02)
  root.add(slit)

  // 옆 톱니 — 얼굴 좌우 바깥, 얇은 원판만
  const gearL = makeFlatGear(0.055, 8)
  gearL.position.set(-0.17, 0.06, 0.015)
  const gearR = makeFlatGear(0.045, 7)
  gearR.position.set(0.16, -0.01, 0.015)
  root.add(gearL, gearR)
  spinners.push(gearL, gearR)

  return {
    root,
    spinners,
    hideLeftEye: true,
    hideRightEye: true,
    eyeColor: new THREE.Color(0xc5a059),
    faceLightColor: 0xc5a059,
    faceLightIntensity: 1.15,
  }
}

/** 2스테이지 — 뒤 후광 링 + 앞 분열 가면. */
function buildPriest(): BossSignature {
  const root = new THREE.Group()
  const spinners: THREE.Object3D[] = []

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.26, 28),
    brassMat(0xe8d4a8, 2.0),
  )
  halo.position.set(0, 0.18, -0.02)
  root.add(halo)
  spinners.push(halo)

  const pale = new THREE.MeshStandardMaterial({
    color: 0xe8e2d8,
    emissive: 0x3a3830,
    emissiveIntensity: 0.5,
    metalness: 0.65,
    roughness: 0.22,
    flatShading: true,
  })
  const leftMask = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.24), pale)
  leftMask.position.set(-0.055, 0.02, 0.02)
  leftMask.rotation.y = 0.15
  const rightMask = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.24),
    pale.clone(),
  )
  rightMask.position.set(0.055, 0.0, 0.02)
  rightMask.rotation.y = -0.15
  root.add(leftMask, rightMask)

  const split = new THREE.Mesh(
    new THREE.PlaneGeometry(0.014, 0.26),
    new THREE.MeshStandardMaterial({
      color: 0x1a0808,
      emissive: 0xb02828,
      emissiveIntensity: 1.5,
      flatShading: true,
    }),
  )
  split.position.set(0, 0.02, 0.03)
  root.add(split)

  return {
    root,
    spinners,
    hideLeftEye: true,
    hideRightEye: true,
    eyeColor: new THREE.Color(0xc5a059),
    faceLightColor: 0xd8d0c4,
    faceLightIntensity: 1.0,
  }
}

/** 3스테이지 — 머리 위 뿔 + 앞면 붉은 눈. */
function buildScaleMaster(): BossSignature {
  const root = new THREE.Group()
  const dark = new THREE.MeshStandardMaterial({
    color: 0x120a06,
    emissive: 0x2a0808,
    emissiveIntensity: 0.35,
    roughness: 0.7,
    flatShading: true,
  })

  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), dark)
  plate.position.set(0, 0.02, 0.01)
  root.add(plate)

  const horns: Array<[number, number, number]> = [
    [-0.1, 0.2, 0.55],
    [0.1, 0.2, -0.55],
    [0, 0.28, 0],
  ]
  for (const [x, y, rotZ] of horns) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.22, 5), dark)
    horn.position.set(x, y, -0.02)
    horn.rotation.z = rotZ
    horn.rotation.x = -0.5
    root.add(horn)
  }

  const eyeGlow = new THREE.MeshStandardMaterial({
    color: 0x8b1e1e,
    emissive: 0xff2020,
    emissiveIntensity: 4.2,
    flatShading: true,
  })
  const lEye = new THREE.Mesh(new THREE.CircleGeometry(0.032, 10), eyeGlow)
  const rEye = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 10),
    eyeGlow.clone(),
  )
  lEye.position.set(-0.045, 0.04, 0.025)
  rEye.position.set(0.045, 0.04, 0.025)
  root.add(lEye, rEye)

  return {
    root,
    spinners: [],
    hideLeftEye: true,
    hideRightEye: true,
    eyeColor: new THREE.Color(0xff2020),
    faceLightColor: 0x8b1e1e,
    faceLightIntensity: 1.5,
  }
}

/** 카메라 향하는 얇은 톱니 원판. */
function makeFlatGear(radius: number, teeth: number): THREE.Group {
  const g = new THREE.Group()
  const mat = brassMat(0xc5a059, 1.7)
  g.add(new THREE.Mesh(new THREE.CircleGeometry(radius * 0.7, 12), mat))
  for (let i = 0; i < teeth; i += 1) {
    const tooth = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 0.28, radius * 0.35),
      mat,
    )
    const a = (i / teeth) * Math.PI * 2
    tooth.position.set(Math.cos(a) * radius * 0.82, Math.sin(a) * radius * 0.82, 0)
    tooth.rotation.z = a
    g.add(tooth)
  }
  return g
}
