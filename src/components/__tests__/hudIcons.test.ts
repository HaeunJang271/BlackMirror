import { describe, expect, it } from 'vitest'
import { RELIC_ICONS, RITUAL_ICONS } from '../HudIcons'

describe('HudIcons', () => {
  it('covers every ritual id', () => {
    expect(Object.keys(RITUAL_ICONS).length).toBe(6)
    expect(RITUAL_ICONS.clairvoyant_coin).toBeTruthy()
  })

  it('covers every relic id', () => {
    expect(Object.keys(RELIC_ICONS).length).toBe(6)
    expect(RELIC_ICONS.broken_hand).toBeTruthy()
  })
})
