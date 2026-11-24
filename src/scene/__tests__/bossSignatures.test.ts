import { describe, expect, it } from 'vitest'
import { createBossSignature } from '../bossSignatures'

describe('createBossSignature', () => {
  it('clockmaker hides eyes and spins gears', () => {
    const sig = createBossSignature('blind_clockmaker')
    expect(sig.hideLeftEye).toBe(true)
    expect(sig.hideRightEye).toBe(true)
    expect(sig.spinners.length).toBeGreaterThan(0)
    expect(sig.root.children.length).toBeGreaterThan(0)
    expect(sig.faceLightIntensity).toBeGreaterThan(0)
  })

  it('priest includes halo spinner and split mask', () => {
    const sig = createBossSignature('mirror_priest')
    expect(sig.spinners.length).toBeGreaterThan(0)
    expect(sig.root.children.length).toBeGreaterThan(2)
    expect(sig.faceLightColor).toBe(0xd8d0c4)
  })

  it('scale master uses red eyes and horns', () => {
    const sig = createBossSignature('scale_master')
    expect(sig.eyeColor.getHex()).toBe(0xff2020)
    expect(sig.root.children.length).toBeGreaterThan(3)
    expect(sig.faceLightColor).toBe(0x8b1e1e)
  })
})
