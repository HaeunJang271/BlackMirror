import * as THREE from 'three'
import { createBrassTexture, texturedMat } from './materialFactory'

export interface CeilingLampRig {
  group: THREE.Group
  spot: THREE.SpotLight
  /**
   * 전구 미세 깜빡임.
   */
  update: (t: number) => void
}

/**
 * 천장 전등 + 위로 뻗는 검은 전선.
 */
export function createCeilingLamp(): CeilingLampRig {
  const group = new THREE.Group()
  group.position.set(0, 2.05, 0.55)

  const brassMap = createBrassTexture()
  const brass = texturedMat({
    map: brassMap,
    roughness: 0.4,
    metalness: 0.75,
    bumpScale: 0.03,
  })
  const metal = texturedMat({
    map: brassMap,
    color: 0x3a342c,
    roughness: 0.7,
    metalness: 0.45,
    bumpScale: 0.04,
  })

  // 천장으로 길게 올라가는 검은 전선
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 3.2, 5),
    new THREE.MeshStandardMaterial({
      color: 0x0a0908,
      roughness: 0.95,
      flatShading: true,
    }),
  )
  cord.position.y = 1.7
  group.add(cord)

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6),
    brass,
  )
  rod.position.y = 0.28
  group.add(rod)

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.48, 0.38, 8, 1, true),
    metal,
  )
  shade.position.y = -0.05
  group.add(shade)

  const shadeInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.44, 0.36, 8, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xffe8c0,
      emissive: 0xe8a856,
      emissiveIntensity: 1.1,
      side: THREE.BackSide,
      flatShading: true,
    }),
  )
  shadeInner.position.y = -0.05
  group.add(shadeInner)

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.02, 6, 16),
    brass,
  )
  rim.position.y = -0.24
  rim.rotation.x = Math.PI / 2
  group.add(rim)

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xfff6e0,
      emissive: 0xffcc66,
      emissiveIntensity: 2.2,
      roughness: 0.25,
      flatShading: true,
    }),
  )
  bulb.position.y = -0.12
  group.add(bulb)

  const spot = new THREE.SpotLight(0xffe8c8, 1.85, 12, Math.PI / 3.8, 0.4, 1.0)
  spot.position.set(0, -0.12, 0)
  spot.target.position.set(0, -2.5, -0.7)
  group.add(spot)
  group.add(spot.target)

  const bulbGlow = new THREE.PointLight(0xe8a856, 0.55, 3.5, 2)
  bulbGlow.position.copy(bulb.position)
  group.add(bulbGlow)

  return {
    group,
    spot,
    update(t: number) {
      const flicker =
        1.7 + Math.sin(t * 7.5) * 0.1 + Math.sin(t * 13.1) * 0.05
      spot.intensity = flicker
      ;(bulb.material as THREE.MeshStandardMaterial).emissiveIntensity =
        2.0 + Math.sin(t * 7.5) * 0.25
      ;(shadeInner.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.0 + Math.sin(t * 7.5) * 0.12
      bulbGlow.intensity = 0.45 + Math.sin(t * 7.5) * 0.08
    },
  }
}
