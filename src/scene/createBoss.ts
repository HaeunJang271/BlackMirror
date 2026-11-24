import * as THREE from 'three'
import type { BossId } from '../types/game'
import { preloadBossPortraits } from './bossPortraits'

export interface BossRig {
  group: THREE.Group
  /** 보스 초상화 이미지를 교체한다. */
  setBoss: (id: BossId) => void
  /** 숨결·피격·끄덕임 애니메이션. */
  update: (t: number, opts: { hit: boolean; nod: boolean }) => void
}

/** 테이블 Box(4.2×0.12×2.4) 기준 — 먼쪽 가장자리 / 상판. */
const TABLE_FAR_Z = -1.2
const TABLE_TOP_Y = 0.06
const PORTRAIT_W = 1.48
const PORTRAIT_H = 1.86
const BASE_Z = TABLE_FAR_Z + 0.01

/**
 * 보스 JPG를 탁자 먼쪽 가장자리에 하단이 맞닿게 배치한다.
 */
export function createBoss(): BossRig {
  const group = new THREE.Group()
  const upper = new THREE.Group()
  // 플레인 하단 = 탁자 상판에 딱 붙임
  upper.position.set(0, TABLE_TOP_Y + PORTRAIT_H / 2, BASE_Z)
  group.add(upper)

  const portraits = preloadBossPortraits()

  const mat = new THREE.MeshBasicMaterial({
    map: portraits.blind_clockmaker,
    transparent: true,
    toneMapped: false,
  })

  const portrait = new THREE.Mesh(
    new THREE.PlaneGeometry(PORTRAIT_W, PORTRAIT_H),
    mat,
  )
  // 살짝 카메라 쪽으로 기울여 가장자리에 앉은 느낌
  portrait.rotation.x = -0.04
  upper.add(portrait)

  const faceLight = new THREE.PointLight(0xe8a856, 0.5, 2.8, 2)
  faceLight.position.set(0, -0.35, 0.4)
  upper.add(faceLight)

  let currentId: BossId = 'blind_clockmaker'
  let hitUntil = 0
  let nodUntil = 0
  const baseY = TABLE_TOP_Y + PORTRAIT_H / 2

  function applyPortrait(id: BossId) {
    currentId = id
    mat.map = portraits[id]
    mat.needsUpdate = true
  }

  applyPortrait('blind_clockmaker')

  return {
    group,
    setBoss(id: BossId) {
      if (id === currentId) return
      applyPortrait(id)
    },
    update(t, opts) {
      if (opts.hit) hitUntil = t + 0.55
      if (opts.nod) nodUntil = t + 0.7

      // 하단은 탁자에 고정, 숨결은 아주 약하게만
      upper.position.y = baseY + Math.sin(t * 1.2) * 0.01
      faceLight.intensity = 0.4 + Math.sin(t * 3.0) * 0.1

      if (t < hitUntil) {
        const k = (hitUntil - t) / 0.55
        upper.rotation.x = -0.12 * k
        upper.position.z = BASE_Z - 0.05 * k
        portrait.position.x = Math.sin(k * 40) * 0.02
      } else if (t < nodUntil) {
        const k = Math.sin(((nodUntil - t) / 0.7) * Math.PI)
        upper.rotation.x = 0.08 * k
        upper.position.z = BASE_Z
        portrait.position.x = 0
      } else {
        upper.rotation.x = THREE.MathUtils.lerp(upper.rotation.x, 0, 0.1)
        upper.position.z = THREE.MathUtils.lerp(upper.position.z, BASE_Z, 0.12)
        portrait.position.x = THREE.MathUtils.lerp(portrait.position.x, 0, 0.15)
      }
    },
  }
}
