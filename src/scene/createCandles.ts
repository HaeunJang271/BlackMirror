import * as THREE from 'three'
import { log } from '../utils/logger'

export interface CandleRig {
  group: THREE.Group
  flames: THREE.Mesh[]
  lights: THREE.PointLight[]
  /** 켜진 촛불 수에 맞춰 불꽃·조명을 갱신한다(감소 시 꺼짐 연출). */
  setLitCount: (count: number) => void
  /** 불꽃 깜빡임·꺼짐·연기 애니메이션. */
  update: (t: number) => void
}

interface SmokePuff {
  mesh: THREE.Mesh
  vel: THREE.Vector3
  life: number
  maxLife: number
}

interface CandleState {
  lit: boolean
  extinguishing: boolean
  extinguishT: number
  baseIntensity: number
}

const EXTINGUISH_SEC = 0.4
const SMOKE_COUNT = 10

/**
 * 테이블 왼쪽 촛불 3개 + PointLight 리그를 만든다.
 */
export function createCandles(): CandleRig {
  const group = new THREE.Group()
  group.position.set(-0.72, 0.06, -0.62)

  const flames: THREE.Mesh[] = []
  const lights: THREE.PointLight[] = []
  const bases: THREE.Mesh[] = []
  const candleGroups: THREE.Group[] = []
  const states: CandleState[] = []
  const smokes: SmokePuff[] = []
  let prevT = 0

  for (let i = 0; i < 3; i += 1) {
    const candle = new THREE.Group()
    candle.position.set(i * 0.16, 0, 0)
    candleGroups.push(candle)

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

    const light = new THREE.PointLight(0xe8a856, 1.15, 4.2, 2)
    light.position.set(0, 0.28, 0)
    candle.add(light)
    lights.push(light)

    states.push({
      lit: true,
      extinguishing: false,
      extinguishT: 0,
      baseIntensity: 1.1,
    })
    group.add(candle)
  }

  function applyBaseLook(i: number, lit: boolean) {
    bases[i]!.material = new THREE.MeshStandardMaterial({
      color: lit ? 0x2a1c10 : 0x12100e,
      roughness: 0.9,
      opacity: lit ? 1 : 0.55,
      transparent: !lit,
    })
  }

  function spawnSmoke(i: number) {
    const origin = candleGroups[i]!
    for (let n = 0; n < SMOKE_COUNT; n += 1) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.012 + Math.random() * 0.01, 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0x6a6a68,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        }),
      )
      mesh.position.set(
        (Math.random() - 0.5) * 0.03,
        0.26,
        (Math.random() - 0.5) * 0.03,
      )
      origin.add(mesh)
      smokes.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          0.18 + Math.random() * 0.22,
          (Math.random() - 0.5) * 0.08,
        ),
        life: 1,
        maxLife: 1,
      })
    }
  }

  function startExtinguish(i: number) {
    const st = states[i]!
    if (st.extinguishing || !st.lit) return
    st.extinguishing = true
    st.extinguishT = 0
    log('info', 'candle extinguish start', { index: i })
  }

  function finishExtinguish(i: number) {
    const st = states[i]!
    st.lit = false
    st.extinguishing = false
    flames[i]!.visible = false
    lights[i]!.intensity = 0
    applyBaseLook(i, false)
    spawnSmoke(i)
  }

  return {
    group,
    flames,
    lights,
    setLitCount(count: number) {
      const next = Math.max(0, Math.min(3, count))
      for (let i = 0; i < 3; i += 1) {
        const st = states[i]!
        if (i < next) {
          // 켜야 함 — 매 동기화마다 강제 점화(연출 레이스 방지)
          const wasOut = !st.lit || st.extinguishing || !flames[i]!.visible
          st.lit = true
          st.extinguishing = false
          st.extinguishT = 0
          flames[i]!.visible = true
          flames[i]!.scale.set(0.7, 1.3, 0.7)
          const mat = flames[i]!.material as THREE.MeshStandardMaterial
          mat.opacity = 0.95
          mat.emissiveIntensity = 2.2
          lights[i]!.intensity = st.baseIntensity
          applyBaseLook(i, true)
          if (wasOut) log('info', 'candle relight', { index: i, count: next })
        } else if (st.lit && !st.extinguishing) {
          startExtinguish(i)
        }
      }
    },
    update(t: number) {
      const dt = prevT === 0 ? 0.016 : Math.min(0.05, t - prevT)
      prevT = t

      for (let i = 0; i < 3; i += 1) {
        const st = states[i]!
        const flame = flames[i]!
        const light = lights[i]!

        if (st.extinguishing) {
          st.extinguishT += dt
          const p = Math.min(1, st.extinguishT / EXTINGUISH_SEC)
          const shake = 1 + Math.sin(t * 48 + i * 9) * (0.45 * (1 - p))
          const shrink = 1 - p
          flame.visible = true
          flame.scale.set(
            0.55 * shake * shrink,
            (1.4 + Math.sin(t * 60) * 0.35) * shrink,
            0.55 * shake * shrink,
          )
          const mat = flame.material as THREE.MeshStandardMaterial
          mat.opacity = 0.95 * (1 - p * 0.85)
          mat.emissiveIntensity = 2.2 * (1 - p)
          light.intensity = st.baseIntensity * (1 - p)
          if (p >= 1) finishExtinguish(i)
          continue
        }

        if (!st.lit || !flame.visible) continue
        const wobble = 1 + Math.sin(t * 8 + i * 1.7) * 0.12
        flame.scale.set(0.65 * wobble, 1.25 + Math.sin(t * 10 + i) * 0.15, 0.65)
        light.intensity = 0.95 + Math.sin(t * 9 + i) * 0.2
      }

      for (let i = smokes.length - 1; i >= 0; i -= 1) {
        const s = smokes[i]!
        s.life -= dt
        s.mesh.position.addScaledVector(s.vel, dt)
        s.mesh.scale.multiplyScalar(1 + dt * 0.8)
        const mat = s.mesh.material as THREE.MeshStandardMaterial
        mat.opacity = Math.max(0, (s.life / s.maxLife) * 0.45)
        if (s.life <= 0) {
          s.mesh.parent?.remove(s.mesh)
          s.mesh.geometry.dispose()
          mat.dispose()
          smokes.splice(i, 1)
        }
      }
    },
  }
}
