import * as THREE from 'three'

export interface CandleRig {
  group: THREE.Group
  flames: THREE.Mesh[]
  lights: THREE.PointLight[]
  /**
   * 켜진 촛불 수에 맞춰 불꽃·조명을 갱신한다.
   */
  setLitCount: (count: number) => void
  /**
   * 불꽃 깜빡임 애니메이션.
   */
  update: (t: number) => void
}

/**
 * 테이블 왼쪽 촛불 3개 + PointLight 리그를 만든다.
 */
export function createCandles(): CandleRig {
  const group = new THREE.Group()
  // 화면 안쪽으로 모아 3개 모두 보이게
  group.position.set(-0.88, 0.06, 0.05)

  const flames: THREE.Mesh[] = []
  const lights: THREE.PointLight[] = []
  const bases: THREE.Mesh[] = []

  for (let i = 0; i < 3; i += 1) {
    const candle = new THREE.Group()
    candle.position.set(i * 0.16, 0, 0)

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.04, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: 0x2a1c10, roughness: 0.85 }),
    )
    body.position.y = 0.11
    body.castShadow = true
    candle.add(body)
    bases.push(body)

    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xe8a856,
        emissive: 0xe8a856,
        emissiveIntensity: 2.2,
        transparent: true,
        opacity: 0.95,
      }),
    )
    flame.position.y = 0.26
    flame.scale.set(0.7, 1.3, 0.7)
    candle.add(flame)
    flames.push(flame)

    const light = new THREE.PointLight(0xe8a856, 0.9, 3.5, 2)
    light.position.set(0, 0.28, 0)
    candle.add(light)
    lights.push(light)

    group.add(candle)
  }

  return {
    group,
    flames,
    lights,
    setLitCount(count: number) {
      for (let i = 0; i < 3; i += 1) {
        const lit = i < count
        flames[i]!.visible = lit
        lights[i]!.intensity = lit ? 0.85 : 0
        bases[i]!.material = new THREE.MeshStandardMaterial({
          color: lit ? 0x2a1c10 : 0x12100e,
          roughness: 0.9,
          opacity: lit ? 1 : 0.55,
          transparent: !lit,
        })
      }
    },
    update(t: number) {
      flames.forEach((flame, i) => {
        if (!flame.visible) return
        const wobble = 1 + Math.sin(t * 8 + i * 1.7) * 0.12
        flame.scale.set(0.65 * wobble, 1.25 + Math.sin(t * 10 + i) * 0.15, 0.65)
        lights[i]!.intensity = 0.7 + Math.sin(t * 9 + i) * 0.18
      })
    },
  }
}
