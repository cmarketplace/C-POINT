import {
  stubCancelOrder,
  stubGetOrder,
  stubListOrders,
  stubPlaceOrder,
  type StubOrderLine,
} from '@/lib/postpaid-mall-stub'
import type { OrderListPage, OrderShipTo, StorefrontOrder } from '@/lib/order-types'

export { PostpaidMallError as OrderError } from '@/lib/postpaid-mall-stub'

/**
 * 주문 — **세모 주문 파이프라인으로 가는 이음새.**
 *
 * 실제 주문은 세모 `/external/storefronts/c-point/orders` (파트너 키, 서버 전용)가
 * 받는다: 접수 → 저장 단가 최저 조합 자동매칭 → 판매·매입 계약 → 배송 → 후불 결제·
 * 계산서(엔씨하이·팝빌). 그 경로가 배포되면 이 파일의 구현만 KCL 몰 `semo-orders.ts`
 * 와 같은 fetch 로 갈아 끼운다 — 시그니처는 그쪽 규약에 이미 맞춰 두었다.
 *
 * 연동 시 달라지는 것 하나: **단가는 세모가 카탈로그에서 재확정한다.** 지금 스텁은
 * 화면 스냅샷 단가를 믿지만, 실연동에서는 화면과 접수 금액이 다를 수 있고 영수증은
 * 서버 확정값만 보여 줘야 한다(이미 그렇게 그린다).
 */

export interface CreateOrderInput {
  memberId: string
  shipTo: OrderShipTo
  lines: StubOrderLine[]
  clientOrderKey: string | null
}

export async function createOrder(input: CreateOrderInput): Promise<StorefrontOrder> {
  return stubPlaceOrder(input)
}

export async function listOrders(memberId: string): Promise<OrderListPage> {
  const orders = stubListOrders(memberId)
  return { orders, total: orders.length }
}

export async function getOrder(memberId: string, orderNo: string): Promise<StorefrontOrder> {
  return stubGetOrder(memberId, orderNo)
}

export async function cancelOrder(memberId: string, orderNo: string): Promise<StorefrontOrder> {
  return stubCancelOrder(memberId, orderNo)
}
