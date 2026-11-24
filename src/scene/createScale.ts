import * as THREE from 'three'
import { log } from '../utils/logger'
import { createBrassTexture, texturedMat } from './materialFactory'

export interface ScaleRig {
  group: THREE.Group
  /** 예상 데미지/배수에 따라 접시 목표 기울기를 설정한다. */
  setTilt: (amount: number) => void
  /** 진실 패 오픈 — 황동 추 낙하 + 스프링 출렁임. */
  dropWeight: () => void
  /** 정산 — 저울대가 바닥에 쿵 하고 황동 불꽃 파티클. */
  slam: () => void
  /** 라운드 리셋 등 — 접시 위 추를 전부 제거한다. */
  clearWeights: () => void
  update: (t: number) => void
}

interface FallingWeight {
  mesh: THREE.Mesh
  t: number
  startY: number
  endY: number
}

interface Spark {
  mesh: THREE.Mesh
  vel: THREE.Vector3
  life: number
}

/**
 * 팔 끝에서 접시 림까지 이어지는 얇은 사슬 3줄을 만든다.
 */
function addDishChains(parent: THREE.Group, brass: THREE.Material): void {
  const dishY = -0.14
  const length = -dishY
  for (let i = 0; i < 3; i += 1) {
    const ang = (i / 3) * Math.PI * 2
    const rimX = Math.cos(ang) * 0.07
    const rimZ = Math.sin(ang) * 0.07
    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0035, length, 5),
      brass,
    )
    chain.position.set(rimX / 2, dishY / 2, rimZ / 2)
    chain.rotation.z = Math.atan2(rimX, length) * 0.5
    chain.rotation.x = -Math.atan2(rimZ, length) * 0.5
    parent.add(chain)
  }
}

/**
 * 브러시드 브라스 저울 — 사슬·추 낙하·스프링 반동·정산 스파크.
 */
export function createScale(): ScaleRig {
  const group = new THREE.Group()
  group.position.set(0.55, 0.08, -0.62)

  const brass = texturedMat({
    map: createBrassTexture(),
    roughness: 0.38,
    metalness: 0.78,
    bumpScale: 0.035,
  })

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.06, 24),
    brass,
  )
  base.position.y = 0.03
  group.add(base)

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, 0.45, 12),
    brass,
  )
  pole.position.y = 0.28
  group.add(pole)

  const beam = new THREE.Group()
  beam.position.y = 0.5
  beam.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.025, 0.025), brass))

  const hangL = new THREE.Group()
  hangL.position.set(-0.32, 0, 0)
  addDishChains(hangL, brass)
  const leftDish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.02, 24),
    brass,
  )
  leftDish.position.set(0, -0.14, 0)
  hangL.add(leftDish)

  const hangR = new THREE.Group()
  hangR.position.set(0.32, 0, 0)
  addDishChains(hangR, brass)
  const rightDish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.02, 24),
    brass,
  )
  rightDish.position.set(0, -0.14, 0)
  hangR.add(rightDish)
  beam.add(hangL, hangR)
  group.add(beam)

  const weightMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    emissive: 0xc5a059,
    emissiveIntensity: 1.4,
    metalness: 0.85,
    roughness: 0.3,
  })
  const soulMat = new THREE.MeshStandardMaterial({
    color: 0xe8d4a8,
    emissive: 0xe8a856,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.9,
  })

  let targetTilt = 0
  let currentTilt = 0
  let springT = 99
  let springAmp = 0
  let slamBoost = 0
  let settled = 0
  const falling: FallingWeight[] = []
  const settledMeshes: THREE.Mesh[] = []
  const sparks: Spark[] = []

  function disposeMesh(mesh: THREE.Mesh) {
    mesh.parent?.remove(mesh)
    mesh.geometry.dispose()
  }

  function spawnWeight() {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 12, 12),
      Math.random() > 0.4 ? weightMat.clone() : soulMat.clone(),
    )
    // 왼쪽 접시(데미지 쪽) 위에서 떨어뜨림 — hangL 로컬 좌표
    const startY = 0.42
    const endY = -0.11
    const ox = (settled % 3) * 0.025 - 0.025
    const oz = Math.floor(settled / 3) * 0.02 - 0.02
    mesh.position.set(ox, startY, oz)
    hangL.add(mesh)
    falling.push({ mesh, t: 0, startY, endY })
    log('info', 'scale weight drop', { settled })
  }

  function spawnSparks() {
    for (let i = 0; i < 14; i += 1) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0xe8a856,
          emissive: 0xc5a059,
          emissiveIntensity: 3,
          transparent: true,
          opacity: 1,
        }),
      )
      mesh.position.set(0, 0.5, 0)
      group.add(mesh)
      sparks.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.4,
          0.6 + Math.random() * 1.2,
          (Math.random() - 0.5) * 1.4,
        ),
        life: 0.55 + Math.random() * 0.25,
      })
    }
  }

  return {
    group,
    setTilt(amount: number) {
      targetTilt = THREE.MathUtils.clamp(amount, -0.45, 0.55)
    },
    dropWeight() {
      spawnWeight()
      springT = 0
      springAmp = 0.22 + Math.min(0.18, Math.abs(targetTilt) * 0.5)
    },
    slam() {
      springT = 0
      springAmp = 0.38
      slamBoost = 0.28
      spawnSparks()
      log('info', 'scale slam')
    },
    clearWeights() {
      for (const w of falling) disposeMesh(w.mesh)
      falling.length = 0
      for (const m of settledMeshes) disposeMesh(m)
      settledMeshes.length = 0
      settled = 0
      springT = 99
      springAmp = 0
      slamBoost = 0
      log('info', 'scale weights cleared')
    },
    update(_t: number) {
      const dt = 0.016
      springT += dt
      const spring =
        Math.sin(springT * 14) * Math.exp(-springT * 4) * springAmp
      const slam =
        slamBoost > 0
          ? -slamBoost *
            Math.exp(-springT * 6) *
            (1 + Math.sin(springT * 20) * 0.3)
          : 0
      if (slamBoost > 0 && springT > 0.8) slamBoost = 0

      currentTilt = THREE.MathUtils.lerp(currentTilt, targetTilt, 0.08)
      beam.rotation.z = currentTilt + spring + slam

      for (let i = falling.length - 1; i >= 0; i -= 1) {
        const w = falling[i]!
        w.t += dt * 2.2
        const p = Math.min(1, w.t)
        const ease = 1 - (1 - p) * (1 - p)
        w.mesh.position.y = w.startY + (w.endY - w.startY) * ease
        if (p >= 1) {
          settledMeshes.push(w.mesh)
          settled += 1
          falling.splice(i, 1)
          springT = 0
          springAmp = Math.max(springAmp, 0.16)
        }
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i]!
        s.life -= dt
        s.vel.y -= 2.8 * dt
        s.mesh.position.addScaledVector(s.vel, dt)
        const mat = s.mesh.material as THREE.MeshStandardMaterial
        mat.opacity = Math.max(0, s.life * 2)
        s.mesh.scale.setScalar(Math.max(0.2, s.life * 2))
        if (s.life <= 0) {
          disposeMesh(s.mesh)
          mat.dispose()
          sparks.splice(i, 1)
        }
      }
    },
  }
}
