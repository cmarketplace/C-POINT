import type { Product } from '@/components/Shop/product.data'

/**
 * 장바구니 금액 계산 — **이 쇼핑몰 금액의 유일한 정본**.
 *
 * 순수 함수만 둔다(React·저장소·부수효과 없음). 장바구니 요약·주문 접수(서버)·영수증이
 * **전부 이 파일만** 쓴다. 화면과 전표가 각자 계산하면 언젠가 갈린다.
 *
 * ## 산식은 씨마켓과 같다 (KCL 몰 `cart-amounts.ts` 에서 가져온 규칙)
 *
 * - **반올림은 사사오입**(`Math.round`). 씨마켓 `bid-rules/vat.ts` 와 같다.
 * - **부가세는 과세 «합계» 에서 한 번만 분리한다.** 줄마다 나눠 더하면 문서끼리
 *   (행수/2)원까지 어긋난다 — 씨마켓이 2026-08-01 에 그룹 1회 분리로 통일한 이유.
 *
 * ## 가격 축
 *
 * `Product.basePrice` 는 **공급가액**이다(부가세 별도). 차감 포인트는 부가세를 얹은
 * 총액이다 — 계산서(엔씨하이 → 기관)가 이 총액 축으로 발행되기 때문이다.
 *
 * ## 면세 축은 아직 없다
 *
 * 이 몰의 승인 품목은 사무용품(전부 과세)이라 지금은 모든 줄을 과세로 계산한다.
 * 면세 품목이 승인되기 시작하면 KCL 몰의 `tax-category.ts` 축(품목별 지정 + 세모
 * 카탈로그 값)을 그대로 끼운다 — 이 함수의 서명은 그때도 바뀌지 않는다.
 */

/** 한국 일반 과세 부가세율. 씨마켓 `bid-rules/vat.ts` 의 `VAT_RATE` 와 같다. */
const VAT_RATE = 0.1

/** 계산 대상 한 줄. 장바구니 줄이든 주문 줄이든 모양은 같다. */
export interface AmountLine {
  product: Pick<Product, 'basePrice'>
  quantity: number
}

export interface CartAmounts {
  /** 공급가액 합 */
  supply: number
  /** 부가세 — 합계에서 한 번만 산출 */
  vat: number
  /** 청구 총액 = 차감 포인트 */
  total: number
}

/** 한 줄의 금액. 반올림하지 않는다 — 반올림은 합계에서 딱 한 번이다. */
export function lineTotal(line: AmountLine): number {
  return line.product.basePrice * line.quantity
}

/** 공급가액 → 부가세 (사사오입). 씨마켓 `vatFromSupply` 와 같다. */
export function vatFromSupply(supply: number): number {
  return Math.round(supply * VAT_RATE)
}

export function calculateCartAmounts(lines: readonly AmountLine[]): CartAmounts {
  const supply = lines.reduce((sum, line) => sum + lineTotal(line), 0)
  const vat = vatFromSupply(supply)

  return { supply, vat, total: supply + vat }
}
