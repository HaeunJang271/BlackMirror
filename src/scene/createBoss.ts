import * as THREE from 'three'
import type { BossId } from '../types/game'
import { preloadBossPortraits } from './bossPortraits'

export interface BossRig {
  group: THREE.Group
  /** 보스 초상화 이미지를 교체한다. */
  setBoss: (id: BossId) => void
  /** 숨결·피격·끄덕임 애니메이션. */
  update: (t: number, opts: { hit: boolean; nod: boolean; lastCandle: boolean }) => void
}

/** 테이블 Box(4.2×0.12×2.4) 기준 — 먼쪽 가장자리 / 상판. */
const TABLE_FAR_Z = -1.2
const TABLE_TOP_Y = 0.06
const PORTRAIT_W = 1.48
const PORTRAIT_H = 1.86
const BASE_Z = TABLE_FAR_Z + 0.01
const BASE_Y = TABLE_TOP_Y + PORTRAIT_H / 2 + 0.15

/**
 * 보스 초상화를 탁자 먼쪽에 배치한다.
 */
export function createBoss(): BossRig {
  const group = new THREE.Group()
  const upper = new THREE.Group()
  upper.position.set(0, BASE_Y, BASE_Z)
  group.add(upper)

  const portraits = preloadBossPortraits()

  const mat = new THREE.MeshBasicMaterial({
    map: portraits.blind_clockmaker,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })

  const portrait = new THREE.Mesh(
    new THREE.PlaneGeometry(PORTRAIT_W, PORTRAIT_H),
    mat,
  )
  const flashMat = new THREE.MeshBasicMaterial({
    map: portraits.blind_clockmaker,
    color: 0xff6130,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
  const flash = new THREE.Mesh(portrait.geometry, flashMat)
  flash.position.z = 0.001
  portrait.add(flash)
  // 살짝 카메라 쪽으로 기울여 가장자리에 앉은 느낌
  portrait.rotation.x = -0.04
  upper.add(portrait)

  const faceLight = new THREE.PointLight(0xe8a856, 0.5, 2.8, 2)
  faceLight.position.set(0, -0.35, 0.4)
  upper.add(faceLight)

  let currentId: BossId = 'blind_clockmaker'
  let hitUntil = 0
  let nodUntil = 0
  let breathPhase = 0
  let lastUpdate: number | null = null

  function applyPortrait(id: BossId) {
    currentId = id
    mat.map = portraits[id]
    mat.needsUpdate = true
    flashMat.map = portraits[id]
    flashMat.needsUpdate = true
  }

  applyPortrait('blind_clockmaker')

  return {
    group,
    setBoss(id: BossId) {
      if (id === currentId) return
      applyPortrait(id)
    },
    update(t, opts) {
      if (opts.hit) hitUntil = t + 0.35
      if (opts.nod) nodUntil = t + 0.7

      const dt = lastUpdate === null ? 0 : Math.min(0.1, Math.max(0, t - lastUpdate))
      lastUpdate = t
      breathPhase += dt * (t < hitUntil || opts.lastCandle ? 2.1 : 1.4)
      const breath = Math.sin(breathPhase)
      upper.position.y = BASE_Y + breath * 0.012
      portrait.scale.y = 1 + breath * 0.015
      faceLight.intensity = 0.4 + Math.sin(t * 3.0) * 0.1

      if (t < hitUntil) {
        const k = (hitUntil - t) / 0.35
        flashMat.opacity = 0.75 * k
        flashMat.color.setHex(k > 0.55 ? 0xff5025 : 0xffc15c)
        upper.rotation.x = -0.12 * k
        upper.position.z = BASE_Z - 0.05 * k
        portrait.position.x = Math.sin((1 - k) * 40) * 0.035 * k
      } else if (t < nodUntil) {
        flashMat.opacity = 0
        const k = Math.sin(((nodUntil - t) / 0.7) * Math.PI)
        upper.rotation.x = 0.08 * k
        upper.position.z = BASE_Z
        portrait.position.x = 0
      } else {
        flashMat.opacity = 0
        upper.rotation.x = THREE.MathUtils.lerp(upper.rotation.x, 0, 0.1)
        upper.position.z = THREE.MathUtils.lerp(upper.position.z, BASE_Z, 0.12)
        portrait.position.x = THREE.MathUtils.lerp(portrait.position.x, 0, 0.15)
      }
    },
  }
}
