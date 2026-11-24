import type { BossDef } from '../types/game'

/** Phase 1~3 계약자 스펙 */
export const BOSSES: BossDef[] = [
  {
    id: 'blind_clockmaker',
    name: '눈 감은 시계공',
    maxHp: 60,
    truthCount: 3,
    curseCount: 2,
    introLine: '초침이 멈춘 자리에서… 네 차례다.',
    gimmickBadge: '15초 · 3장 +0.5',
    gimmickDescription: '매 턴 15초 제한. 진실을 3장째 열면 콤보 배수 +0.5',
    turnTimerSec: 15,
    thirdSuccessMultBonus: 0.5,
  },
  {
    id: 'mirror_priest',
    name: '거울 속 성직자',
    maxHp: 110,
    truthCount: 3,
    curseCount: 2,
    introLine: '비친 것은 진실인가, 저주인가.',
    gimmickBadge: '가짜 암시',
    gimmickDescription: '매 라운드 저주 1장이 진실처럼 흔들리는 가짜 암시',
  },
  {
    id: 'scale_master',
    name: '검은 저울의 주인',
    maxHp: 180,
    truthCount: 2,
    curseCount: 3,
    introLine: '촛불이 하나 남았을 때, 저울은 폭주한다.',
    gimmickBadge: '최후 촛불 ×2',
    gimmickDescription: '촛불이 1개일 때 정산 배수 ×2',
    lastCandleMult: 2,
  },
]

/**
 * 스테이지 인덱스로 보스 스펙을 반환한다.
 */
export function getBoss(stageIndex: number): BossDef {
  const boss = BOSSES[stageIndex]
  if (!boss) {
    throw new Error(`Invalid stage index: ${stageIndex}`)
  }
  return boss
}
