import type { BossDef } from '../types/game'

/** Phase 1~3 계약자 스펙 */
export const BOSSES: BossDef[] = [
  {
    id: 'blind_clockmaker',
    name: '눈 감은 시계공',
    maxHp: 60,
    truthCount: 3,
    curseCount: 2,
    introLine: '초침이 멈춘 자리에서 네 차례다. 늦으면 불이 꺼지지.',
    hitLine: '째깍 톱니가 어긋나는군.',
    curseLine: '시간은 거짓말을 기다려 주지 않아.',
    defeatLine: '마침내 0시 0분 1초가 움직인다.',
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
    introLine: '깨진 거울에 비친 건 진실일까, 네 욕심일까.',
    hitLine: '그 빛 내 거울을 꿰뚫었구나.',
    curseLine: '스스로 믿고 싶었던 거짓에 찔렸네.',
    defeatLine: '거울 너머의 어둠이 걷히고 있어.',
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
    introLine: '촛불 세 개로 내 저울을 달겠다고? 목숨이 가볍군.',
    hitLine: '흥 뼈가 울릴 만큼 무거운 진실이네.',
    curseLine: '네 영혼이 한 겹 더 가벼워졌다.',
    lastCandleLine: '마지막 불씨인가. 좋다, 저울이 너를 배로 부풀려 주지.',
    defeatLine: '내 저울이 처음으로 기울었구나. 자정이 끝난다.',
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
