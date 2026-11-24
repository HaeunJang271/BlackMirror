import { describe, expect, it } from 'vitest'
import { createBossSignature } from '../bossSignatures'

describe('createBossSignature (legacy procedural)', () => {
  it('still builds distinct poses per boss', () => {
    expect(createBossSignature('blind_clockmaker').handPose).toBe('orb')
    expect(createBossSignature('mirror_priest').handPose).toBe('prayer')
    expect(createBossSignature('scale_master').handPose).toBe('steeple')
  })
})
