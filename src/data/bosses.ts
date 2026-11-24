import type { BossDef } from '../types/game'

/** Phase 1~3 계약자 스펙 */
export const BOSSES: BossDef[] = [
  {
    id: 'blind_clockmaker',
    name: '눈 감은 시계공',
    maxHp: 60,
    truthCount: 3,
    curseCount: 2,
    introLine: '12초 안에 골라.',
    hitLine: '한 칸 밀렸군.',
    curseLine: '늦었어.',
    defeatLine: '시계가 멈춘다.',
    gimmickBadge: '12초 · 3장 +0.5',
    gimmickDescription: '매 턴 12초 제한. 진실을 3장째 열면 콤보 배수 +0.5',
    turnTimerSec: 12,
    thirdSuccessMultBonus: 0.5,
  },
  {
    id: 'mirror_priest',
    name: '거울 속 성직자',
    maxHp: 100,
    truthCount: 3,
    curseCount: 2,
    introLine: '패 하나가 거짓말을 한다.',
    hitLine: '금이 갔군.',
    curseLine: '잘못 짚었어.',
    defeatLine: '거울이 식는다.',
    gimmickBadge: '가짜 암시',
    gimmickDescription: '매 턴 10초 제한. 저주 1장이 진실처럼 흔들리는 가짜 암시',
    turnTimerSec: 10,
  },
  {
    id: 'scale_master',
    name: '검은 저울의 주인',
    maxHp: 150,
    truthCount: 2,
    curseCount: 3,
    introLine: '올려 봐.',
    hitLine: '제법 무겁군.',
    curseLine: '하나 꺼졌다.',
    lastCandleLine: '마지막 불씨. 배로 받아 가지.',
    defeatLine: '저울이 기울었다.',
    gimmickBadge: '최후 촛불 ×2',
    gimmickDescription: '매 턴 8초 제한. 촛불이 1개일 때 정산 배수 ×2',
    turnTimerSec: 8,
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
