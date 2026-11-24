import type { BossId } from '../types/game'
import { buildClockmaker } from './bossSigClockmaker'
import { buildPriest } from './bossSigPriest'
import { buildScaleMaster } from './bossSigScaleMaster'
import type { BossSignature } from './bossSigShared'

export type { BossHandPose, BossSignature } from './bossSigShared'

/**
 * 보스별 시그니처를 생성한다 (레퍼런스 일러스트 기준).
 */
export function createBossSignature(id: BossId): BossSignature {
  if (id === 'blind_clockmaker') return buildClockmaker()
  if (id === 'mirror_priest') return buildPriest()
  return buildScaleMaster()
}
