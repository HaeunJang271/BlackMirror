import { describe, expect, it } from 'vitest'
import { RELIC_ICONS, RITUAL_ICONS } from '../HudIcons'
import { ALL_RITUAL_IDS } from '../../data/rituals'
import { ALL_RELIC_IDS } from '../../data/relics'

describe('HudIcons', () => {
  it('covers every ritual id', () => {
    expect(Object.keys(RITUAL_ICONS)).toEqual(expect.arrayContaining(ALL_RITUAL_IDS))
  })

  it('covers every relic id', () => {
    expect(Object.keys(RELIC_ICONS)).toEqual(expect.arrayContaining(ALL_RELIC_IDS))
  })
})
