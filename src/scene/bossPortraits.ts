import * as THREE from 'three'
import type { BossId } from '../types/game'
import { log } from '../utils/logger'

/** 스테이지별 보스 초상화 경로 (public/). */
export const BOSS_PORTRAIT_URL: Record<BossId, string> = {
  blind_clockmaker: '/bosses/stage1_clockmaker.jpg',
  mirror_priest: '/bosses/stage2_priest.jpg',
  scale_master: '/bosses/stage3_scale_master.jpg',
}

/**
 * 보스 초상화 Texture를 로드한다.
 */
export function loadBossPortrait(id: BossId): THREE.Texture {
  const url = BOSS_PORTRAIT_URL[id]
  const tex = new THREE.TextureLoader().load(
    url,
    () => log('info', 'boss portrait loaded', { id, url }),
    undefined,
    (err) => log('error', 'boss portrait load failed', { id, url, err }),
  )
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  return tex
}

/**
 * 세 보스 초상화를 미리 로드한다.
 */
export function preloadBossPortraits(): Record<BossId, THREE.Texture> {
  return {
    blind_clockmaker: loadBossPortrait('blind_clockmaker'),
    mirror_priest: loadBossPortrait('mirror_priest'),
    scale_master: loadBossPortrait('scale_master'),
  }
}
