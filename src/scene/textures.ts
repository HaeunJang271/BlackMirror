import * as THREE from 'three'

/**
 * Canvas로 텍스처를 만들고 Three.js CanvasTexture를 반환한다.
 */
export function makeCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 256,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2D canvas context unavailable')
  }
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/**
 * 어두운 나뭇결 + 긁힌 자국 테이블 텍스처.
 */
export function createWoodTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#0d0b0a'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 40; i += 1) {
      const y = (i / 40) * size
      ctx.strokeStyle = `rgba(${20 + (i % 5) * 4}, ${14 + (i % 3) * 3}, 10, 0.35)`
      ctx.lineWidth = 1 + (i % 3)
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x < size; x += 8) {
        ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 2)
      }
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(80,60,40,0.25)'
    for (let i = 0; i < 18; i += 1) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * size, Math.random() * size)
      ctx.lineTo(Math.random() * size, Math.random() * size)
      ctx.stroke()
    }
  }, 512)
}

/**
 * 카드 뒷면 (황동 다이아몬드).
 */
export function createCardBackTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#14100c'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = '#c5a059'
    ctx.lineWidth = 6
    ctx.strokeRect(12, 12, size - 24, size - 24)
    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.rotate(Math.PI / 4)
    ctx.strokeStyle = 'rgba(197,160,89,0.7)'
    ctx.lineWidth = 3
    ctx.strokeRect(-36, -36, 72, 72)
    ctx.restore()
  })
}

/**
 * 진실 앞면 — 황동 태양/눈.
 */
export function createTruthFaceTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    const g = ctx.createLinearGradient(0, 0, 0, size)
    g.addColorStop(0, '#2a2215')
    g.addColorStop(1, '#15110c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = '#c5a059'
    ctx.lineWidth = 8
    ctx.strokeRect(10, 10, size - 20, size - 20)
    ctx.fillStyle = '#c5a059'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2 - 10, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0d0b0a'
    ctx.beginPath()
    ctx.ellipse(size / 2, size / 2 - 10, 18, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e8a856'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2 - 10, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#c5a059'
    ctx.font = 'bold 36px serif'
    ctx.textAlign = 'center'
    ctx.fillText('진실', size / 2, size - 36)
  })
}

/**
 * 저주 앞면 — 핏빛 균열/해골.
 */
export function createCurseFaceTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    const g = ctx.createLinearGradient(0, 0, 0, size)
    g.addColorStop(0, '#2a1010')
    g.addColorStop(1, '#120808')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = '#8b1e1e'
    ctx.lineWidth = 8
    ctx.strokeRect(10, 10, size - 20, size - 20)
    ctx.strokeStyle = 'rgba(176,40,40,0.85)'
    ctx.lineWidth = 3
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath()
      ctx.moveTo(40 + i * 12, 40)
      ctx.lineTo(60 + i * 8, size - 50)
      ctx.stroke()
    }
    ctx.fillStyle = '#b02828'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2 - 8, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#120808'
    ctx.fillRect(size / 2 - 14, size / 2 - 18, 10, 12)
    ctx.fillRect(size / 2 + 4, size / 2 - 18, 10, 12)
    ctx.fillStyle = '#b02828'
    ctx.font = 'bold 36px serif'
    ctx.textAlign = 'center'
    ctx.fillText('저주', size / 2, size - 36)
  })
}
