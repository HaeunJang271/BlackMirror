import { describe, expect, it } from 'vitest'
import { BOSS_PORTRAIT_URL } from '../bossPortraits'

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
