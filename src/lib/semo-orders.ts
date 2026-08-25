import type { OrderListPage, OrderStatus, StorefrontOrder } from '@/lib/order-types'
import { PostpaidMallError } from '@/lib/postpaid-mall-stub'
import { resolveSemoApi, storefrontUrl } from '@/lib/semo-api'

/**
 * 세모 주문 클라이언트 — `orders.ts` 가 세모 모드에서 위임하는 곳.
 *
 * 세모 쪽 실체: `/external/storefronts/{slug}/orders` — 접수 → 저장 단가 최저 조합
 * 자동매칭(«공급사 확정») → 계약·배송·후불 결제(카드결제창·팝빌 계산서)는 다음 단계.
 * 후불 몰이라 **포인트 축이 없다** — FITI 의 `semo-points-orders.ts` 에서 그 절반을
 * 뺀 것이 이 파일이다.
 *
 * 응답은 `{success, data, message}` 봉투다. 4xx 의 message 는 담당자가 고칠 수 있는
 * 말(품절 품목 등)이라 그대로 전달한다.
 */

const UPSTREAM_TIMEOUT_MS = 10_000

interface SemoEnvelope<T> {
  success?: boolean
  data?: T
  message?: string
}

async function semoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const config = resolveSemoApi()

  const response = await fetch(storefrontUrl(config, path), {
    ...init,
    headers: {
      'X-API-Key': config.apiKey,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as SemoEnvelope<T> | null

  if (!response.ok || payload?.success === false || payload?.data === undefined) {
    const message = payload?.message ?? `세모 응답 오류 (${response.status})`
    throw new PostpaidMallError(response.status >= 400 ? response.status : 502, message)
  }

  return payload.data
}

interface SemoOrderPayload {
  orderNo: string
  status: string
  employeeNo: string | null
  shipToName: string
  shipToZip: string
  shipToAddress: string
  shipToTel: string | null
  totalSupply: number
  totalVat: number
  totalPayable: number
  canceledAt: string | null
  createdAt: string
  items: {
    seq: number
    itemId: string
    name: string
    spec: string | null
    unit: string | null
    quantity: number
    salePrice: number
  }[]
}

function toMallOrder(order: SemoOrderPayload): StorefrontOrder {
  return {
    orderNo: order.orderNo,
    status: order.status as OrderStatus,
    memberId: order.employeeNo ?? '',
    shipToName: order.shipToName,
    shipToZip: order.shipToZip,
    shipToAddress: order.shipToAddress,
    shipToTel: order.shipToTel,
    totalSupply: order.totalSupply,
    totalVat: order.totalVat,
    totalPayable: order.totalPayable,
    canceledAt: order.canceledAt,
    createdAt: order.createdAt,
    items: order.items.map(item => ({
      seq: item.seq,
      itemId: item.itemId,
      name: item.name,
      spec: item.spec,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.salePrice,
    })),
  }
}

export async function semoCreateOrder(input: {
  memberId: string
  shipTo: { name: string; zip: string; address: string; tel: string | null }
  /** 세모는 품목 id 와 수량만 받는다 — 단가는 카탈로그가 재확정한다(스텁과 다른 지점). */
  lines: { itemId: string; quantity: number }[]
  clientOrderKey: string | null
}): Promise<StorefrontOrder> {
  const order = await semoFetch<SemoOrderPayload>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      employeeNo: input.memberId,
      shipTo: {
        name: input.shipTo.name,
        zip: input.shipTo.zip,
        address: input.shipTo.address,
        ...(input.shipTo.tel ? { tel: input.shipTo.tel } : {}),
      },
      items: input.lines.map(line => ({ itemId: line.itemId, quantity: line.quantity })),
      ...(input.clientOrderKey ? { clientOrderKey: input.clientOrderKey } : {}),
    }),
  })
  return toMallOrder(order)
}

export async function semoListOrders(memberId: string): Promise<OrderListPage> {
  const page = await semoFetch<{ orders: SemoOrderPayload[]; total: number }>(
    `/orders?employeeNo=${encodeURIComponent(memberId)}&limit=50`,
  )
  return { orders: page.orders.map(toMallOrder), total: page.total }
}

/**
 * 주문 1건 — **소유 검증은 몰의 몫이다.** 세모 조회는 몰 단위라 주문번호만 맞으면
 * 돌려준다. 남의 주문은 «없는 주문»(404)으로 접는다 — 403 은 존재를 알려 준다.
 */
export async function semoGetOrder(memberId: string, orderNo: string): Promise<StorefrontOrder> {
  const order = await semoFetch<SemoOrderPayload>(`/orders/${encodeURIComponent(orderNo)}`)
  if ((order.employeeNo ?? '') !== memberId) {
    throw new PostpaidMallError(404, '주문을 찾을 수 없습니다.')
  }
  return toMallOrder(order)
}

export async function semoCancelOrder(memberId: string, orderNo: string): Promise<StorefrontOrder> {
  // 취소 전에 소유를 확인한다 — 세모 취소 API 는 몰 단위라, 이 확인이 없으면
  // 주문번호를 추측한 사람이 남의 주문을 닫을 수 있다.
  await semoGetOrder(memberId, orderNo)

  const order = await semoFetch<SemoOrderPayload>(
    `/orders/${encodeURIComponent(orderNo)}/cancel`,
    { method: 'POST', body: JSON.stringify({}) },
  )
  return toMallOrder(order)
}
