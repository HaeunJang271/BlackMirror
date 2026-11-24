import * as THREE from 'three'
import { makeCanvasTexture } from './textures'

function fillNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: string,
  amp = 18,
) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  const img = ctx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amp
    d[i] = Math.max(0, Math.min(255, (d[i] ?? 0) + n))
    d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] ?? 0) + n))
    d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] ?? 0) + n))
  }
  ctx.putImageData(img, 0, 0)
}

/**
 * 어두운 노이즈 + 스크래치 범프용 텍스처.
 */
export function createNoiseBumpTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    fillNoise(ctx, size, '#808080', 40)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    for (let i = 0; i < 30; i += 1) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * size, Math.random() * size)
      ctx.lineTo(Math.random() * size, Math.random() * size)
      ctx.lineWidth = 0.5 + Math.random()
      ctx.stroke()
    }
  }, 128)
}

/**
 * 낡은 천/망토 텍스처.
 */
export function createClothTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    fillNoise(ctx, size, '#0c0a08', 14)
    ctx.strokeStyle = 'rgba(30,24,18,0.4)'
    for (let y = 0; y < size; y += 3) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y + Math.sin(y * 0.2) * 1.5)
      ctx.stroke()
    }
  }, 256)
}

/**
 * 브러시드 브라스 텍스처.
 */
export function createBrassTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    fillNoise(ctx, size, '#8a7040', 22)
    ctx.strokeStyle = 'rgba(197,160,89,0.35)'
    for (let y = 0; y < size; y += 2) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * size, 0)
      ctx.lineTo(Math.random() * size, size)
      ctx.stroke()
    }
  }, 256)
}

/**
 * 뒤쪽 나무 벽면 텍스처.
 */
export function createWallTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    fillNoise(ctx, size, '#12100c', 12)
    for (let x = 0; x < size; x += 28) {
      ctx.fillStyle = `rgba(${18 + (x % 7)}, ${14 + (x % 5)}, 10, 0.55)`
      ctx.fillRect(x, 0, 26, size)
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, size)
      ctx.stroke()
    }
  }, 256)
}

/**
 * 텍스처 + bump가 들어간 PS1풍 StandardMaterial.
 */
export function texturedMat(opts: {
  map: THREE.Texture
  color?: number
  roughness?: number
  metalness?: number
  bumpScale?: number
}): THREE.MeshStandardMaterial {
  const bump = createNoiseBumpTexture()
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping
  opts.map.wrapS = opts.map.wrapT = THREE.RepeatWrapping
  return new THREE.MeshStandardMaterial({
    map: opts.map,
    color: opts.color ?? 0xffffff,
    roughness: opts.roughness ?? 0.9,
    metalness: opts.metalness ?? 0.05,
    bumpMap: bump,
    bumpScale: opts.bumpScale ?? 0.04,
    flatShading: true,
  })
}
