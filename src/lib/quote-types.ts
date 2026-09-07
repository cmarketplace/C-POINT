import type { OrderRoute } from '@/lib/order-types'

/**
 * 견적서 — «견적서 먼저, 주문은 결재 후».
 *
 * 기관 담당자는 주문 전에 품의를 올려야 한다. 장바구니(또는 구독 설계)에서 견적번호와
 * 유효기간이 박힌 견적서를 먼저 받고, 결재가 끝나면 **그 견적번호로** 주문한다.
 * 견적 유효기간 안에는 단가가 잠긴다.
 *
 * 견적서는 몰이 발급하는 문서다 — 세모 주문 파이프라인과 별개의 원장(`quotes.ts`)이고,
 * 주문에는 `quoteNo` 로만 연결된다.
 */

export type QuoteKind = 'CART' | 'SUBSCRIPTION'

/** 견적 유효기간(일). 이 안에는 견적 단가로 주문할 수 있다. */
export const QUOTE_VALID_DAYS = 7

export interface QuoteLine {
  itemId: string
  name: string
  spec: string | null
  unit: string | null
  quantity: number
  unitPrice: number
  offerId: string | null
  supplierName: string | null
}

export interface QuoteSubscription {
  planKey: string
  planName: string
  people: number
  frequencyLabel: string
  /** 월 예상 금액(공급가액). */
  monthlyEstimate: number
}

export interface StorefrontQuote {
  quoteNo: string
  kind: QuoteKind
  memberId: string
  createdAt: string
  /** 이 시각까지 견적 단가로 주문할 수 있다. */
  validUntil: string
  route: OrderRoute | null
  lines: QuoteLine[]
  supply: number
  shipping: number
  vat: number
  total: number
  supplierCount: number
  subscription: QuoteSubscription | null
}

export function isQuoteValid(quote: Pick<StorefrontQuote, 'validUntil'>, now = new Date()): boolean {
  return new Date(quote.validUntil).getTime() >= now.getTime()
}
