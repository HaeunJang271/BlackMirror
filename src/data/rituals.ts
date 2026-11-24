import type { RitualDef, RitualId } from '../types/game'

/** 의식 카드 6종 */
export const RITUALS: Record<RitualId, RitualDef> = {
  clairvoyant_coin: {
    id: 'clairvoyant_coin',
    name: '투시의 은화',
    description: '덮인 패 1장의 앞면을 나만 본다.',
  },
  salt_circle: {
    id: 'salt_circle',
    name: '소금의 원',
    description: '저주 1회 방어 후 점수 유지·즉시 정산.',
  },
  blood_pact: {
    id: 'blood_pact',
    name: '피의 서약',
    description: '최종 배수 ×2. 저주 시 촛불 2개 소모.',
  },
  swapped_card: {
    id: 'swapped_card',
    name: '뒤바뀐 패',
    description: '미공개 저주 1장을 판에서 제거한다.',
  },
  ash_breath: {
    id: 'ash_breath',
    name: '재의 숨결',
    description: '꺼진 촛불 1개를 즉시 재점화한다. (런 1회)',
  },
  forbidden_hand: {
    id: 'forbidden_hand',
    name: '금단의 손',
    description: '연 진실 1장의 기본 점수를 한 번 더 복사.',
  },
}

/** 손패 보충용 전체 의식 카드 ID 목록 */
export const ALL_RITUAL_IDS: RitualId[] = Object.keys(RITUALS) as RitualId[]
