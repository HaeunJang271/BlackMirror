import * as THREE from 'three'
import type { BossId } from '../types/game'
import { log } from '../utils/logger'

/** 스테이지별 보스 초상화 경로 (public/). */
export const BOSS_PORTRAIT_URL: Record<BossId, string> = {
  blind_clockmaker: '/bosses/stage1_clockmaker.jpg',
  mirror_priest: '/bosses/stage2_priest.jpg',
  scale_master: '/bosses/stage3_scale_master.jpg',
}

function smoothstep(start: number, end: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

/** 어두운 배경과 초상화의 가장자리를 방의 어둠에 섞는다. */
export function fadePortraitEdges(image: ImageData): void {
  const { data, width, height } = image
  for (let y = 0; y < height; y += 1) {
    const top = smoothstep(0, 0.18, y / height)
    const bottom = smoothstep(0, 0.15, (height - 1 - y) / height)
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const left = smoothstep(0, 0.18, x / width)
      const right = smoothstep(0, 0.18, (width - 1 - x) / width)
      const darkness = smoothstep(0, 42, data[i]! + data[i + 1]! + data[i + 2]!)
      data[i + 3] = Math.round(data[i + 3]! * darkness * left * right * top * bottom)
    }
  }
}

/**
 * 보스 초상화 Texture를 로드한다.
 */
export function loadBossPortrait(id: BossId): THREE.Texture {
  const url = BOSS_PORTRAIT_URL[id]
  const tex = new THREE.TextureLoader().load(
    url,
    (texture) => {
      const image = texture.image as HTMLImageElement
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        log('error', 'boss portrait canvas unavailable', { id, url })
        return
      }
      ctx.drawImage(image, 0, 0)
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
      fadePortraitEdges(pixels)
      ctx.putImageData(pixels, 0, 0)
      Object.assign(texture, { image: canvas })
      texture.needsUpdate = true
      log('info', 'boss portrait loaded', { id, url })
    },
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
