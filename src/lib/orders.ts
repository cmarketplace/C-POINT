import {
  stubCancelOrder,
  stubGetOrder,
  stubListOrders,
  stubPlaceOrder,
  type StubOrderLine,
} from '@/lib/postpaid-mall-stub'
import { isSemoConfigured } from '@/lib/semo-api'
import {
  semoCancelOrder,
  semoCreateOrder,
  semoGetOrder,
  semoListOrders,
} from '@/lib/semo-orders'
import type { OrderListPage, OrderShipTo, StorefrontOrder } from '@/lib/order-types'

export { PostpaidMallError as OrderError } from '@/lib/postpaid-mall-stub'

/**
 * 주문 — **세모 주문 파이프라인으로 가는 이음새.**
 *
 * `SEMO_API_BASE`/`SEMO_API_KEY` 가 채워진 환경에서는 세모가 정본이다:
 * 접수 → 저장 단가 최저 조합 자동매칭(«공급사 확정») → 계약·배송·후불 결제
 * (카드결제창·팝빌 계산서)는 다음 단계. **단가는 세모가 카탈로그에서 재확정한다** —
 * 세모 모드에서는 화면 스냅샷 단가를 보내지 않으며, 영수증은 서버 확정값만 그린다.
 *
 * 키가 없으면 로컬 스텁 원장이 자리를 지킨다(개발·데모).
 */

export interface CreateOrderInput {
  memberId: string
  shipTo: OrderShipTo
  lines: StubOrderLine[]
  clientOrderKey: string | null
}

export async function createOrder(input: CreateOrderInput): Promise<StorefrontOrder> {
  if (isSemoConfigured()) {
    return semoCreateOrder({
      memberId: input.memberId,
      shipTo: input.shipTo,
      lines: input.lines.map(line => ({ itemId: line.itemId, quantity: line.quantity })),
      clientOrderKey: input.clientOrderKey,
    })
  }
  return stubPlaceOrder(input)
}

export async function listOrders(memberId: string): Promise<OrderListPage> {
  if (isSemoConfigured()) return semoListOrders(memberId)
  const orders = stubListOrders(memberId)
  return { orders, total: orders.length }
}

export async function getOrder(memberId: string, orderNo: string): Promise<StorefrontOrder> {
  if (isSemoConfigured()) return semoGetOrder(memberId, orderNo)
  return stubGetOrder(memberId, orderNo)
}

export async function cancelOrder(memberId: string, orderNo: string): Promise<StorefrontOrder> {
  if (isSemoConfigured()) return semoCancelOrder(memberId, orderNo)
  return stubCancelOrder(memberId, orderNo)
}
