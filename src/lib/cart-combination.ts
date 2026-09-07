import type { CatalogOffer, Product } from '@/components/Shop/product.data'
import {
  bestOffer,
  effectiveOffers,
  findOffer,
  supplierKey,
  supplierLabel,
  unitPriceAt,
} from '@/lib/offer-pricing'

/**
 * 장바구니 단위 업체 조합 — 순수 함수.
 *
 * 제품 하나의 가격 비교는 누구나 한다. 이 몰의 차별점은 «12품목을 3곳으로 조합할지,
 * 1곳으로 몰지» 를 담당자가 토글 하나로 비교하는 데 있다. 절감액만이 아니라
 * **배송 건수·계산서 장수**를 같이 낸다 — 담당자는 몇천 원 절감보다 서류 세 장이 더 싫다.
 *
 *   best   최저가 조합 — 줄마다 가장 싼 오퍼(세모 자동매칭과 같은 결과)
 *   single 업체 최소화 — 모든 줄을 댈 수 있는 업체 중 합계가 가장 싼 한 곳
 *   manual 직접 고르기 — 줄마다 손님이 지정(지정 안 한 줄은 최저가)
 */

export type CombinationMode = 'best' | 'single' | 'manual'

export const COMBINATION_LABEL: Record<CombinationMode, string> = {
  best: '최저가 조합',
  single: '업체 최소화',
  manual: '직접 고르기',
}

export interface CombinationInput {
  product: Product
  quantity: number
  /** 손님이 지정한 오퍼(직접 고르기). 없으면 최저가. */
  offerId: string | null
}

export interface AssignedLine {
  product: Product
  quantity: number
  offer: CatalogOffer
  unitPrice: number
  lineTotal: number
  /** 이 줄에서 가능한 최저 단가. «최저 대비 +N원» 의 기준. */
  cheapestUnitPrice: number
}

export interface SupplierGroup {
  key: string
  label: string
  supplierId: string | null
  supply: number
  shippingFee: number
  lineCount: number
}

export interface CombinationResult {
  mode: CombinationMode
  lines: AssignedLine[]
  groups: SupplierGroup[]
  /** 공급가액 합(배송비 제외) */
  supply: number
  shipping: number
  supplierCount: number
}

function assignLine(input: CombinationInput, offer: CatalogOffer): AssignedLine {
  const offers = effectiveOffers(input.product)
  const cheapest = bestOffer(offers, input.quantity) ?? offer
  const unitPrice = unitPriceAt(offer, input.quantity)
  return {
    product: input.product,
    quantity: input.quantity,
    offer,
    unitPrice,
    lineTotal: unitPrice * input.quantity,
    cheapestUnitPrice: unitPriceAt(cheapest, input.quantity),
  }
}

/** 공급사 단위 배송비. 면제 기준은 그 업체에 몰린 공급가액 합으로 본다. */
function shippingFor(offer: CatalogOffer, supply: number): number {
  if (!offer.shippingFee) return 0
  if (offer.freeShippingOver !== null && supply >= offer.freeShippingOver) return 0
  return offer.shippingFee
}

function groupLines(lines: AssignedLine[]): SupplierGroup[] {
  const map = new Map<string, { offer: CatalogOffer; supply: number; lineCount: number }>()
  for (const line of lines) {
    const key = supplierKey(line.offer)
    const entry = map.get(key)
    if (entry) {
      entry.supply += line.lineTotal
      entry.lineCount += 1
    } else {
      map.set(key, { offer: line.offer, supply: line.lineTotal, lineCount: 1 })
    }
  }
  return [...map.entries()].map(([key, entry]) => ({
    key,
    label: supplierLabel(entry.offer),
    supplierId: entry.offer.supplierId,
    supply: entry.supply,
    shippingFee: shippingFor(entry.offer, entry.supply),
    lineCount: entry.lineCount,
  }))
}

function finish(mode: CombinationMode, lines: AssignedLine[]): CombinationResult {
  const groups = groupLines(lines)
  return {
    mode,
    lines,
    groups,
    supply: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    shipping: groups.reduce((sum, group) => sum + group.shippingFee, 0),
    supplierCount: groups.length,
  }
}

/**
 * 모든 줄을 댈 수 있는 업체들. **실명(supplierId)이 있는 오퍼만** 센다 —
 * 익명 오퍼는 상품끼리 같은 업체인지 알 수 없어 «한 곳» 으로 묶을 근거가 없다.
 */
export function singleSupplierCandidates(inputs: readonly CombinationInput[]): string[] {
  if (inputs.length === 0) return []
  const perLine = inputs.map(
    input =>
      new Set(
        effectiveOffers(input.product)
          .filter(offer => offer.supplierId)
          .map(offer => offer.supplierId as string),
      ),
  )
  return [...perLine[0]].filter(id => perLine.every(set => set.has(id)))
}

export function combine(inputs: readonly CombinationInput[], mode: CombinationMode): CombinationResult {
  if (mode === 'single') {
    const candidates = singleSupplierCandidates(inputs)
    if (candidates.length > 0) {
      const scored = candidates.map(supplierId => {
        const lines = inputs.map(input => {
          const offer = effectiveOffers(input.product).find(item => item.supplierId === supplierId)!
          return assignLine(input, offer)
        })
        return finish('single', lines)
      })
      scored.sort((a, b) => a.supply + a.shipping - (b.supply + b.shipping))
      return scored[0]
    }
    // 한 곳으로 못 모으면 최저가 조합으로 떨어진다 — 호출 쪽은 `singleSupplierCandidates` 로
    // 그 모드를 아예 감추므로 여기 오는 일은 드물다.
  }

  const lines = inputs.map(input => {
    const offers = effectiveOffers(input.product)
    const chosen = mode === 'manual' ? findOffer(offers, input.offerId) : null
    const offer = chosen ?? bestOffer(offers, input.quantity) ?? offers[0]
    return assignLine(input, offer)
  })
  return finish(mode === 'single' ? 'best' : mode, lines)
}
