import * as THREE from 'three'

export interface CeilingLampRig {
  group: THREE.Group
  spot: THREE.SpotLight
  /**
   * 전구 미세 깜빡임.
   */
  update: (t: number) => void
}

/**
 * 1인칭 시야 상단에 보이도록 매달린 전등.
 * 카메라(~y1.6, z2.5)가 테이블을 내려다보므로 갓이 화면 위쪽에 들어오게 배치한다.
 */
export function createCeilingLamp(): CeilingLampRig {
  const group = new THREE.Group()
  // 화면 상단 중앙에 걸리도록 — 너무 높으면 FOV 밖
  group.position.set(0, 2.05, 0.55)

  const metal = new THREE.MeshStandardMaterial({
    color: 0x4a4034,
    metalness: 0.55,
    roughness: 0.5,
    flatShading: true,
  })
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    metalness: 0.75,
    roughness: 0.35,
    emissive: 0x3a2a10,
    emissiveIntensity: 0.25,
    flatShading: true,
  })

  // 짧은 체인
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6),
    brass,
  )
  rod.position.y = 0.28
  group.add(rod)

  const link = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.01, 6, 10),
    brass,
  )
  link.position.y = 0.48
  link.rotation.x = Math.PI / 2
  group.add(link)

  // 큰 갓 — 시야에서 확실히 보이게
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.48, 0.38, 8, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x2a2218,
      metalness: 0.35,
      roughness: 0.65,
      flatShading: true,
      side: THREE.DoubleSide,
    }),
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

  // 갓 테두리 링
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.02, 6, 16),
    brass,
  )
  rim.position.y = -0.24
  rim.rotation.x = Math.PI / 2
  group.add(rim)

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xfff6e0,
      emissive: 0xffcc66,
      emissiveIntensity: 2.2,
      roughness: 0.25,
    }),
  )
  bulb.position.y = -0.12
  group.add(bulb)

  // 천장으로 이어지는 가상 줄 (위쪽으로 길게)
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 1.2, 4),
    metal,
  )
  cord.position.y = 1.0
  group.add(cord)

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
