import type { RelicDef, RelicId } from '../types/game'

/** 유물 6종 */
export const RELICS: Record<RelicId, RelicDef> = {
  golden_pan: { id: 'golden_pan', name: '황금 저울판', description: '스테이지 시작 시 무작위 의식 1장 추가.' },
  wax_charm: { id: 'wax_charm', name: '촛농의 부적', description: '매 스테이지 첫 저주 1회를 무효화한다.' },
  chalice_of_ruin: { id: 'chalice_of_ruin', name: '파멸의 성배', description: '한 턴에 의식 2장 이상 사용 시 데미지 ×2.' },
  broken_hand: {
    id: 'broken_hand',
    name: '부러진 초침',
    description: '진실 정확히 2장 정산 시 최종 배수 ×1.8',
  },
  wet_matchbox: {
    id: 'wet_matchbox',
    name: '젖은 성냥갑',
    description: '촛불 1개일 때 정산 데미지 ×2.5',
  },
  cracked_mirror: {
    id: 'cracked_mirror',
    name: '금 간 거울',
    description: '의식 카드 사용 턴 정산 시 기본 점수 +20',
  },
  crow_feather: {
    id: 'crow_feather',
    name: '까마귀 깃털',
    description: '진실 3장 이상 연속 시 마지막 카드 점수 ×3',
  },
  rusty_weight: {
    id: 'rusty_weight',
    name: '녹슨 저울추',
    description: '스테이지 시작 저주 +1. 매 턴 기본 배수 ×1.5',
  },
  ashen_seal: {
    id: 'ashen_seal',
    name: '재투성이 인장',
    description: '저주 밟을 때마다 정산 데미지 영구 +15%',
  },
}

/** 보상 풀용 전체 유물 ID 목록 */
export const ALL_RELIC_IDS: RelicId[] = Object.keys(RELICS) as RelicId[]
