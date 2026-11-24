import * as THREE from 'three'
import {
  brassMat,
  makeFlatGear,
  type BossSignature,
} from './bossSigShared'

/**
 * 1스테이지 — 붕대·황동 단안경·어깨 톱니·시계 오브 (레퍼런스).
 */
export function buildClockmaker(): BossSignature {
  const root = new THREE.Group()
  const torso = new THREE.Group()
  const spinners: THREE.Object3D[] = []

  const mono = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.052, 0.04, 12),
    brassMat(0xe8a856, 2.8),
  )
  mono.rotation.x = Math.PI / 2
  mono.position.set(0.05, 0.03, 0.04)
  root.add(mono)

  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 12),
    new THREE.MeshStandardMaterial({
      color: 0x1a1008,
      emissive: 0xe8a856,
      emissiveIntensity: 3.2,
      flatShading: true,
    }),
  )
  lens.position.set(0.05, 0.03, 0.062)
  root.add(lens)

  const bandageMat = new THREE.MeshStandardMaterial({
    color: 0x8a7a62,
    roughness: 0.92,
    flatShading: true,
  })
  for (let i = 0; i < 4; i += 1) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.028, 0.012),
      bandageMat,
    )
    strip.position.set(-0.04, 0.05 - i * 0.028, 0.035 + i * 0.004)
    strip.rotation.z = -0.35 + i * 0.08
    root.add(strip)
  }

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.008, 0.008),
    new THREE.MeshStandardMaterial({ color: 0x3a2818, flatShading: true }),
  )
  mouth.position.set(0, -0.06, 0.04)
  root.add(mouth)

  const g1 = makeFlatGear(0.08, 9)
  g1.position.set(-0.28, -0.15, 0.12)
  const g2 = makeFlatGear(0.055, 7)
  g2.position.set(-0.22, -0.22, 0.14)
  g2.rotation.z = 0.4
  torso.add(g1, g2)
  spinners.push(g1, g2)

  const orb = new THREE.Group()
  orb.position.set(0, -0.55, 0.28)
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 10),
    brassMat(0xe8a856, 1.8),
  )
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.012, 6, 16),
    brassMat(0xc5a059, 1.2),
  )
  ring.rotation.x = Math.PI / 2
  const orbGear = makeFlatGear(0.07, 8)
  orbGear.position.z = 0.02
  orb.add(core, ring, orbGear)
  torso.add(orb)
  spinners.push(orbGear, ring)

  return {
    root,
    torso,
    spinners,
    hideLeftEye: true,
    hideRightEye: true,
    eyeColor: new THREE.Color(0xe8a856),
    faceLightColor: 0xe8a856,
    faceLightIntensity: 1.35,
    handPose: 'orb',
    showPaleFace: true,
  }
}
