import * as THREE from 'three'
import { brassMat, type BossSignature } from './bossSigShared'

/**
 * 2스테이지 — 부서진 후광·균열 거울 가면·핏빛 눈·스톨 (레퍼런스).
 */
export function buildPriest(): BossSignature {
  const root = new THREE.Group()
  const torso = new THREE.Group()
  const spinners: THREE.Object3D[] = []

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.3, 28),
    brassMat(0xd4b878, 1.8),
  )
  halo.position.set(0, 0.12, -0.08)
  root.add(halo)
  spinners.push(halo)

  for (let i = 0; i < 10; i += 1) {
    if (i % 3 === 0) continue
    const a = (i / 10) * Math.PI * 2 + 0.2
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.1, 4),
      brassMat(0xc5a059, 1.2),
    )
    spike.position.set(Math.cos(a) * 0.32, 0.12 + Math.sin(a) * 0.32, -0.08)
    spike.rotation.z = a - Math.PI / 2
    root.add(spike)
  }

  const pale = new THREE.MeshStandardMaterial({
    color: 0xe4ddd0,
    metalness: 0.72,
    roughness: 0.18,
    flatShading: true,
  })
  const mask = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), pale)
  mask.position.set(0, 0.02, 0.02)
  mask.scale.set(0.85, 1.05, 1)
  root.add(mask)

  const crack = new THREE.Mesh(
    new THREE.PlaneGeometry(0.028, 0.26),
    new THREE.MeshStandardMaterial({
      color: 0x0a0404,
      emissive: 0x4a0808,
      emissiveIntensity: 0.6,
      flatShading: true,
    }),
  )
  crack.position.set(0.01, 0.02, 0.03)
  crack.rotation.z = 0.08
  root.add(crack)

  const redEye = new THREE.Mesh(
    new THREE.CircleGeometry(0.028, 10),
    new THREE.MeshStandardMaterial({
      color: 0x8b1e1e,
      emissive: 0xff2020,
      emissiveIntensity: 3.5,
      flatShading: true,
    }),
  )
  redEye.position.set(0.01, 0.04, 0.04)
  root.add(redEye)

  const stoleMat = brassMat(0xc5a059, 0.6)
  stoleMat.metalness = 0.55
  for (const x of [-0.1, 0.1]) {
    const stole = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.55, 0.02),
      stoleMat,
    )
    stole.position.set(x, -0.45, 0.16)
    torso.add(stole)
  }
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.015), stoleMat)
  const crossArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.03, 0.015),
    stoleMat,
  )
  cross.position.set(0, -0.22, 0.2)
  crossArm.position.set(0, -0.2, 0.2)
  torso.add(cross, crossArm)

  return {
    root,
    torso,
    spinners,
    hideLeftEye: true,
    hideRightEye: true,
    eyeColor: new THREE.Color(0xff2020),
    faceLightColor: 0xd8d0c4,
    faceLightIntensity: 1.1,
    handPose: 'prayer',
    showPaleFace: false,
  }
}
