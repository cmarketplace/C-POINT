/**
 * 정기구독 상품 — 사무실 청소·간식 박스·사무소모품.
 *
 * 위펀처럼 «인원수» 로 월 예산이 바로 나오게 한다. B2B 담당자는 장바구니가 아니라 예산으로
 * 산다 — 품목을 고르기 전에 «한 달에 얼마인가» 를 먼저 안다.
 *
 * ⚠️ 여기 단가는 **예상 산식**이다. 화면은 반드시 «예상 금액 · 견적 확정 시 달라질 수
 * 있습니다» 를 붙인다. 실제 단가는 견적서(`quotes.ts`)에서 담당자가 확정한다. 운영 단가가
 * 정해지면 이 파일만 고친다.
 */

export interface SubscriptionFrequency {
  label: string
  /** 월 기본 산식에 곱하는 배수. */
  multiplier: number
}

export interface SubscriptionPlan {
  key: 'clean' | 'snack' | 'supply'
  name: string
  description: string
  /** 인원당 월 단가(공급가액). */
  perPersonMonthly: number
  /** 인원과 무관한 월 기본료(방문 인건비 등). */
  baseMonthly: number
  frequencies: SubscriptionFrequency[]
  defaultFrequency: number
  /** 이 구독이 실제로 담는 것 — 손님이 «무엇이 오는지» 를 알아야 한다. */
  includes: string[]
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    key: 'clean',
    name: '사무실 청소',
    description: '전문 인력 방문 청소. 회의실·탕비실·화장실, 소모품 보충 포함.',
    perPersonMonthly: 3_200,
    baseMonthly: 120_000,
    frequencies: [
      { label: '주 1회', multiplier: 1 },
      { label: '주 2회', multiplier: 2 },
      { label: '주 3회', multiplier: 3 },
    ],
    defaultFrequency: 1,
    includes: ['회의실·탕비실·화장실 청소', '쓰레기 수거·분리배출', '휴지·핸드워시 보충'],
  },
  {
    key: 'snack',
    name: '간식 박스',
    description: '취향 설문으로 구성한 큐레이션 박스. 남는 품목은 다음 달 자동 교체.',
    perPersonMonthly: 7_500,
    baseMonthly: 0,
    frequencies: [
      { label: '월 1회', multiplier: 1 },
      { label: '격주', multiplier: 2 },
      { label: '매주', multiplier: 4 },
    ],
    defaultFrequency: 0,
    includes: ['과자·음료·커피믹스 큐레이션', '취향 설문 반영', '남는 품목 자동 교체'],
  },
  {
    key: 'supply',
    name: '사무소모품',
    description: '복사용지·토너·필기구를 사용량 기준으로 자동 보충. 재고 사진 한 장이면 수량 조정.',
    perPersonMonthly: 4_200,
    baseMonthly: 0,
    frequencies: [
      { label: '월 1회', multiplier: 1 },
      { label: '격주', multiplier: 2 },
    ],
    defaultFrequency: 0,
    includes: ['복사용지·토너 정기 보충', '필기구·파일류', '재고 사진으로 수량 조정'],
  },
] as const

/** 세 가지를 함께 구독할 때 깎는 비율. 계산서도 한 장으로 합친다. */
export const BUNDLE_DISCOUNT_RATE = 0.05

export const MIN_PEOPLE = 5
export const MAX_PEOPLE = 500

/** 인원·주기 → 월 예상 금액(공급가액). 100원 단위로 반올림한다 — 예상 금액에 1원 단위는 거짓 정밀도다. */
export function estimateMonthly(plan: SubscriptionPlan, people: number, frequencyIndex: number): number {
  const frequency = plan.frequencies[frequencyIndex] ?? plan.frequencies[plan.defaultFrequency]
  const raw = (plan.baseMonthly + plan.perPersonMonthly * people) * frequency.multiplier
  return Math.round(raw / 100) * 100
}

export function clampPeople(value: number): number {
  if (!Number.isFinite(value)) return MIN_PEOPLE
  return Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, Math.round(value)))
}
