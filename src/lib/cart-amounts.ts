import type { Product } from '@/components/Shop/product.data'

/**
 * 장바구니 금액 계산 — **이 쇼핑몰 금액의 유일한 정본**.
 *
 * 순수 함수만 둔다(React·저장소·부수효과 없음). 장바구니 요약·견적서·주문 접수(서버)·
 * 영수증이 **전부 이 파일만** 쓴다. 화면과 전표가 각자 계산하면 언젠가 갈린다.
 *
 * ## 산식은 씨마켓과 같다 (KCL 몰 `cart-amounts.ts` 에서 가져온 규칙)
 *
 * - **반올림은 사사오입**(`Math.round`). 씨마켓 `bid-rules/vat.ts` 와 같다.
 * - **부가세는 과세 «합계» 에서 한 번만 분리한다.** 줄마다 나눠 더하면 문서끼리
 *   (행수/2)원까지 어긋난다 — 씨마켓이 2026-08-01 에 그룹 1회 분리로 통일한 이유.
 *
 * ## 가격 축
 *
 * 단가는 **공급가액**이다(부가세 별도). 청구 총액은 부가세를 얹은 값이다 — 계산서가
 * 이 총액 축으로 발행되기 때문이다.
 *
 * ## 단가는 줄이 정한다
 *
 * 예전에는 `product.basePrice` 였다(항상 최저가). 이제 손님이 업체를 고를 수 있어
 * 줄마다 `unitPrice` 가 있다. 옛 호출(basePrice 만 있는 줄)도 받는다.
 *
 * ## 배송비
 *
 * 공급사 단위로 붙는다(`cart-combination.ts`). 과세 대상이라 부가세 산출 전에 더한다.
 *
 * ## 면세 축은 아직 없다
 *
 * 이 몰의 승인 품목은 사무용품(전부 과세)이라 지금은 모든 줄을 과세로 계산한다.
 * 면세 품목이 승인되기 시작하면 KCL 몰의 `tax-category.ts` 축을 그대로 끼운다.
 */

/** 한국 일반 과세 부가세율. 씨마켓 `bid-rules/vat.ts` 의 `VAT_RATE` 와 같다. */
const VAT_RATE = 0.1

/** 계산 대상 한 줄. 장바구니 줄이든 주문 줄이든 모양은 같다. */
export interface AmountLine {
  quantity: number
  /** 이 줄의 공급가액 단가. 없으면 `product.basePrice`(최저가)다. */
  unitPrice?: number
  product?: Pick<Product, 'basePrice'>
}

export interface CartAmounts {
  /** 공급가액 합(배송비 제외) */
  supply: number
  /** 배송비 합 */
  shipping: number
  /** 부가세 — (공급가액 + 배송비)에서 한 번만 산출 */
  vat: number
  /** 청구 총액 */
  total: number
}

export function lineUnitPrice(line: AmountLine): number {
  return line.unitPrice ?? line.product?.basePrice ?? 0
}

/** 한 줄의 금액. 반올림하지 않는다 — 반올림은 합계에서 딱 한 번이다. */
export function lineTotal(line: AmountLine): number {
  return lineUnitPrice(line) * line.quantity
}

/** 과세 표준 → 부가세 (사사오입). 씨마켓 `vatFromSupply` 와 같다. */
export function vatFromSupply(supply: number): number {
  return Math.round(supply * VAT_RATE)
}

export function calculateCartAmounts(
  lines: readonly AmountLine[],
  options: { shipping?: number } = {},
): CartAmounts {
  const supply = lines.reduce((sum, line) => sum + lineTotal(line), 0)
  const shipping = Math.max(0, Math.round(options.shipping ?? 0))
  const vat = vatFromSupply(supply + shipping)

  return { supply, shipping, vat, total: supply + shipping + vat }
}
