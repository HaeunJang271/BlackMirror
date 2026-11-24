import * as THREE from 'three'
import { brassMat, type BossSignature } from './bossSigShared'

/**
 * 3스테이지 — 뿔 왕관·사슬 베일·노란 눈·비늘 흉갑 (레퍼런스).
 */
export function buildScaleMaster(): BossSignature {
  const root = new THREE.Group()
  const torso = new THREE.Group()
  const dark = new THREE.MeshStandardMaterial({
    color: 0x0e0a08,
    emissive: 0x1a0808,
    emissiveIntensity: 0.25,
    roughness: 0.78,
    flatShading: true,
  })
  const metal = brassMat(0x6a5030, 0.5)
  metal.color.set(0x3a2a18)

  const veil = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), dark)
  veil.position.set(0, 0.02, 0.015)
  veil.scale.set(0.9, 1.1, 1)
  root.add(veil)

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xe8a040,
    emissive: 0xffb020,
    emissiveIntensity: 4.5,
    flatShading: true,
  })
  const lEye = new THREE.Mesh(new THREE.CircleGeometry(0.03, 10), eyeMat)
  const rEye = new THREE.Mesh(
    new THREE.CircleGeometry(0.03, 10),
    eyeMat.clone(),
  )
  lEye.position.set(-0.045, 0.04, 0.03)
  rEye.position.set(0.045, 0.04, 0.03)
  root.add(lEye, rEye)

  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.07, 8),
    metal,
  )
  crown.position.set(0, 0.2, -0.02)
  root.add(crown)

  const horns: Array<[number, number, number, number]> = [
    [-0.14, 0.38, -0.04, 0.7],
    [0.14, 0.38, -0.04, -0.7],
    [-0.05, 0.42, -0.06, 0.2],
    [0.05, 0.42, -0.06, -0.2],
  ]
  for (const [x, y, z, rotZ] of horns) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.28, 5), dark)
    horn.position.set(x, y, z)
    horn.rotation.z = rotZ
    horn.rotation.x = -0.45
    root.add(horn)
  }

  for (const x of [-0.1, 0, 0.1]) {
    const chain = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.18, 0.008), metal)
    chain.position.set(x, 0.08, 0.04)
    root.add(chain)
    const charm = new THREE.Mesh(new THREE.OctahedronGeometry(0.02), metal)
    charm.position.set(x, -0.02, 0.05)
    root.add(charm)
  }

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const scale = new THREE.Mesh(new THREE.CircleGeometry(0.035, 5), metal)
      scale.position.set(
        -0.12 + col * 0.06,
        -0.28 - row * 0.055,
        0.2 + (col % 2) * 0.01,
      )
      scale.rotation.x = -0.2
      torso.add(scale)
    }
  }

  return {
    root,
    torso,
    spinners: [],
    hideLeftEye: true,
    hideRightEye: true,
    eyeColor: new THREE.Color(0xffb020),
    faceLightColor: 0xe8a040,
    faceLightIntensity: 1.45,
    handPose: 'steeple',
    showPaleFace: false,
  }
}
