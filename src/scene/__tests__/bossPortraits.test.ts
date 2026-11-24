import { describe, expect, it } from 'vitest'
import { BOSS_PORTRAIT_URL, fadePortraitEdges } from '../bossPortraits'

describe('BOSS_PORTRAIT_URL', () => {
  it('maps each boss to a public jpg path', () => {
    expect(BOSS_PORTRAIT_URL.blind_clockmaker).toBe(
      '/bosses/stage1_clockmaker.jpg',
    )
    expect(BOSS_PORTRAIT_URL.mirror_priest).toBe('/bosses/stage2_priest.jpg')
    expect(BOSS_PORTRAIT_URL.scale_master).toBe(
      '/bosses/stage3_scale_master.jpg',
    )
  })
})

describe('보스 초상화 페이드', () => {
  it('중앙의 밝은 인물은 유지하고 어두운 배경과 네 가장자리를 부드럽게 지운다', () => {
    const width = 100
    const data = new Uint8ClampedArray(width * width * 4).fill(255)
    const pixel = (x: number, y: number) => (y * width + x) * 4
    data.set([7, 7, 7, 255], pixel(50, 50))
    data.set([0, 0, 0, 255], pixel(51, 50))
    fadePortraitEdges({ data, width, height: width } as ImageData)
    expect(data[pixel(25, 25) + 3]).toBe(255)
    expect(data[pixel(0, 50) + 3]).toBe(0)
    expect(data[pixel(99, 50) + 3]).toBe(0)
    expect(data[pixel(50, 0) + 3]).toBe(0)
    expect(data[pixel(50, 99) + 3]).toBe(0)
    expect(data[pixel(50, 91) + 3]).toBeGreaterThan(0)
    expect(data[pixel(50, 91) + 3]).toBeLessThan(255)
    expect(data[pixel(50, 50) + 3]).toBeGreaterThan(0)
    expect(data[pixel(50, 50) + 3]).toBeLessThan(255)
    expect(data[pixel(51, 50) + 3]).toBe(0)
  })
})
