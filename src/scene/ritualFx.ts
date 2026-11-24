import * as THREE from 'three'
import type { RitualId } from '../types/game'
import { log } from '../utils/logger'

export interface RitualFxCue {
  ritualId: RitualId
  targetCardId?: string
  key: number
}

export interface RitualFxRig {
  group: THREE.Group
  /**
   * 소금의 원 활성 여부를 반영한다.
   */
  setSaltActive: (active: boolean) => void
  /**
   * 소금 원이 방어로 깨질 때.
   */
  breakSalt: () => void
  /**
   * 피의 서약 붉은 틴트.
   */
  setBloodTint: (
    active: boolean,
    lights: THREE.Light[],
    fog: THREE.FogExp2 | null,
  ) => void
  /**
   * 일회성 의식 연출을 큐에 넣는다.
   */
  trigger: (cue: RitualFxCue) => void
  /**
   * 매 프레임 갱신. 추가 콜백으로 카드 FX를 연결한다.
   */
  update: (
    dt: number,
    hooks: {
      clairvoyance: (cardId: string) => void
      forbidden: (cardId: string) => void
    },
  ) => void
  /**
   * 피의 서약 화면 맥동 강도(0~1).
   */
  getBloodPulse: () => number
}

/**
 * 의식 카드 공용 3D 이펙트 리그.
 */
export function createRitualFx(): RitualFxRig {
  const group = new THREE.Group()

  const saltRing = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.68, 48),
    new THREE.MeshBasicMaterial({
      color: 0xf2efe6,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  )
  saltRing.rotation.x = -Math.PI / 2
  saltRing.position.set(0, 0.095, -0.12)
  saltRing.visible = false
  group.add(saltRing)

  const sparkles: THREE.Points[] = []
  let saltBreaking = false
  let saltBreakT = 0
  let bloodActive = false
  let bloodPulse = 0
  let pending: RitualFxCue | null = null
  let lastKey = -1

  const baseLightColors = new Map<THREE.Light, THREE.Color>()

  return {
    group,
    setSaltActive(active: boolean) {
      if (active && !saltBreaking) {
        saltRing.visible = true
        ;(saltRing.material as THREE.MeshBasicMaterial).opacity = 0.75
        saltRing.scale.setScalar(1)
      } else if (!active && !saltBreaking) {
        saltRing.visible = false
        ;(saltRing.material as THREE.MeshBasicMaterial).opacity = 0
      }
    },
    breakSalt() {
      if (!saltRing.visible) return
      saltBreaking = true
      saltBreakT = 0
      log('info', 'salt ring break')
    },
    setBloodTint(active, lights, fog) {
      bloodActive = active
      lights.forEach((light) => {
        if (!('color' in light)) return
        const l = light as THREE.Light & { color: THREE.Color }
        if (!baseLightColors.has(light)) {
          baseLightColors.set(light, l.color.clone())
        }
        const base = baseLightColors.get(light)!
        if (active) {
          l.color.copy(base).lerp(new THREE.Color(0x8b1e1e), 0.45)
        } else {
          l.color.copy(base)
        }
      })
      if (fog) {
        fog.color.set(active ? 0x1a0808 : 0x080606)
      }
    },
    trigger(cue: RitualFxCue) {
      if (cue.key === lastKey) return
      lastKey = cue.key
      pending = cue
    },
    update(dt, hooks) {
      if (pending) {
        const cue = pending
        pending = null
        if (cue.ritualId === 'clairvoyant_coin' && cue.targetCardId) {
          hooks.clairvoyance(cue.targetCardId)
        }
        if (cue.ritualId === 'forbidden_hand' && cue.targetCardId) {
          hooks.forbidden(cue.targetCardId)
          const pts = makeSparks(0xc5a059)
          pts.position.set(0, 0.2, -0.05)
          group.add(pts)
          sparkles.push(pts)
        }
        if (cue.ritualId === 'salt_circle') {
          saltRing.visible = true
          ;(saltRing.material as THREE.MeshBasicMaterial).opacity = 0.85
        }
      }

      if (saltRing.visible && !saltBreaking) {
        saltRing.rotation.z += dt * 0.6
      }
      if (saltBreaking) {
        saltBreakT += dt
        const p = Math.min(1, saltBreakT / 0.45)
        ;(saltRing.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - p)
        saltRing.scale.setScalar(1 + p * 0.8)
        if (p >= 1) {
          saltBreaking = false
          saltRing.visible = false
          saltRing.scale.setScalar(1)
        }
      }

      bloodPulse = bloodActive
        ? 0.45 + Math.sin(performance.now() * 0.008) * 0.35
        : Math.max(0, bloodPulse - dt * 2)

      for (let i = sparkles.length - 1; i >= 0; i -= 1) {
        const pts = sparkles[i]!
        pts.position.y += dt * 0.4
        pts.position.x += dt * 0.25
        const mat = pts.material as THREE.PointsMaterial
        mat.opacity -= dt * 1.4
        if (mat.opacity <= 0) {
          group.remove(pts)
          sparkles.splice(i, 1)
        }
      }
    },
    getBloodPulse() {
      return bloodPulse
    },
  }
}

function makeSparks(color: number): THREE.Points {
  const count = 24
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 0.2
    positions[i * 3 + 1] = Math.random() * 0.1
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color,
      size: 0.035,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  )
}
