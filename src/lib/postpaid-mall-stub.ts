import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { calculateCartAmounts } from '@/lib/cart-amounts'
import {
  CANCELABLE_STATUSES,
  type OrderItem,
  type OrderRoute,
  type OrderShipTo,
  type PaymentMethod,
  type StorefrontOrder,
} from '@/lib/order-types'

/**
 * 후불몰 스텁 주문 원장 — **연동 전의 임시 뼈대다. 정본이 아니다.**
 *
 * 실제 주문의 정본은 세모 주문 파이프라인(`/external/storefronts/{slug}/orders`)이다:
 * 접수 → 공급사 확정 → 판매·매입 계약 → 배송 → 결제·계산서 → 정산.
 * 그 경로가 열리면 `orders.ts` 의 구현만 갈아 끼우고 이 파일은 지운다.
 *
 * 후불이라 주문 시점에 돈이 오가지 않고, 결제·계산서는 배송완료 뒤 씨마켓 축의 일이다.
 * 그래서 이 스텁이 지키는 것은 둘뿐이다: 멱등(같은 클릭 = 주문 한 건)과 소유(내 주문만 보인다).
 *
 * 저장: `var/postpaid-mall-stub.json` (.gitignore). 로컬 dev 에서는 재시작에도 남고,
 * 파일을 못 쓰는 환경에서는 메모리로만 돈다 — 그 환경에 갈 때는 이미 실연동이어야 한다.
 */

interface StubState {
  version: 1
  orders: StorefrontOrder[]
  /** clientOrderKey → orderNo. 재시도 멱등성의 축. */
  orderKeys: Record<string, string>
  orderSeq: number
}

export class PostpaidMallError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'PostpaidMallError'
  }
}

const STORE_PATH = path.join(process.cwd(), 'var', 'postpaid-mall-stub.json')

/** dev 서버의 HMR 이 모듈을 다시 평가해도 상태가 살아남게 globalThis 에 둔다. */
const globalStore = globalThis as unknown as { __postpaidMallStub?: StubState }

/**
 * 경로·공급사 축이 생기기 전에 저장된 주문을 지금 모양으로 맞춘다.
 * 옛 주문은 전부 «안전결제·배송비 0·공급사 1곳» 으로 읽는다 — 그때는 그 축이 없었다.
 */
function normalizeOrder(order: StorefrontOrder): StorefrontOrder {
  return {
    ...order,
    route: order.route ?? 'SAFE',
    paymentMethod: order.paymentMethod ?? null,
    quoteNo: order.quoteNo ?? null,
    totalShipping: order.totalShipping ?? 0,
    supplierCount: order.supplierCount ?? 1,
    items: order.items.map(item => ({
      ...item,
      offerId: item.offerId ?? null,
      supplierName: item.supplierName ?? null,
    })),
  }
}

function loadState(): StubState {
  if (globalStore.__postpaidMallStub) return globalStore.__postpaidMallStub

  let state: StubState = { version: 1, orders: [], orderKeys: {}, orderSeq: 0 }
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as StubState
    if (parsed?.version === 1) {
      state = { ...parsed, orders: parsed.orders.map(normalizeOrder) }
    }
  } catch {
    // 첫 실행(파일 없음)이거나 손으로 고치다 깨진 경우 — 빈 원장에서 다시 시작한다.
  }

  globalStore.__postpaidMallStub = state
  return state
}

function saveState(state: StubState): void {
  globalStore.__postpaidMallStub = state
  try {
    mkdirSync(path.dirname(STORE_PATH), { recursive: true })
    writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8')
  } catch {
    // 파일을 못 쓰는 환경(서버리스)에서는 메모리로만 유지한다.
  }
}

/** KST 벽시계 날짜 8자리 — 서버가 UTC 여도 주문일은 한국 날짜여야 한다. */
function kstDateStamp(): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\D/g, '')
}

export interface StubOrderLine {
  itemId: string
  name: string
  spec: string | null
  unit: string | null
  quantity: number
  /** 공급가액 단가 — 스텁은 화면 스냅샷을 믿는다. 세모 연동 시 카탈로그가 재확정한다. */
  unitPrice: number
  offerId: string | null
  supplierName: string | null
}

export function stubPlaceOrder(input: {
  memberId: string
  shipTo: OrderShipTo
  lines: StubOrderLine[]
  clientOrderKey: string | null
  route: OrderRoute
  paymentMethod: PaymentMethod | null
  quoteNo: string | null
  shipping: number
}): StorefrontOrder {
  const state = loadState()

  // 멱등 — 같은 클릭의 재시도는 이미 선 주문을 돌려준다.
  if (input.clientOrderKey) {
    const existingNo = state.orderKeys[input.clientOrderKey]
    const existing = existingNo ? state.orders.find(order => order.orderNo === existingNo) : null
    if (existing) return existing
  }

  const amounts = calculateCartAmounts(
    input.lines.map(line => ({ unitPrice: line.unitPrice, quantity: line.quantity })),
    { shipping: input.shipping },
  )

  const supplierCount = new Set(
    input.lines.map(line => line.supplierName ?? line.offerId ?? line.itemId),
  ).size

  state.orderSeq += 1
  const orderNo = `CP${kstDateStamp()}-${String(state.orderSeq).padStart(4, '0')}`

  const items: OrderItem[] = input.lines.map((line, index) => ({
    seq: index + 1,
    itemId: line.itemId,
    name: line.name,
    spec: line.spec,
    unit: line.unit,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    offerId: line.offerId,
    supplierName: line.supplierName,
  }))

  const order: StorefrontOrder = {
    orderNo,
    status: 'PLACED',
    memberId: input.memberId,
    route: input.route,
    paymentMethod: input.route === 'SAFE' ? input.paymentMethod : null,
    quoteNo: input.quoteNo,
    shipToName: input.shipTo.name,
    shipToZip: input.shipTo.zip,
    shipToAddress: input.shipTo.address,
    shipToTel: input.shipTo.tel,
    totalSupply: amounts.supply,
    totalShipping: amounts.shipping,
    totalVat: amounts.vat,
    totalPayable: amounts.total,
    supplierCount,
    canceledAt: null,
    createdAt: new Date().toISOString(),
    items,
  }

  state.orders.push(order)
  if (input.clientOrderKey) state.orderKeys[input.clientOrderKey] = orderNo

  saveState(state)
  return order
}

export function stubListOrders(memberId: string): StorefrontOrder[] {
  return loadState()
    .orders.filter(order => order.memberId === memberId)
    .reverse()
}

/** 남의 주문은 «없는 주문» 이다 — 403 은 그 번호가 존재한다는 것을 알려 준다(KCL 교훈). */
export function stubGetOrder(memberId: string, orderNo: string): StorefrontOrder {
  const order = loadState().orders.find(
    row => row.orderNo === orderNo && row.memberId === memberId,
  )
  if (!order) throw new PostpaidMallError(404, '주문을 찾을 수 없습니다.')
  return order
}

export function stubCancelOrder(memberId: string, orderNo: string): StorefrontOrder {
  const state = loadState()
  const order = state.orders.find(row => row.orderNo === orderNo && row.memberId === memberId)
  if (!order) throw new PostpaidMallError(404, '주문을 찾을 수 없습니다.')

  if (order.status === 'CANCELED') return order // 취소의 재시도도 멱등이다

  if (!CANCELABLE_STATUSES.includes(order.status)) {
    throw new PostpaidMallError(
      409,
      '공급사 계약이 진행되어 화면에서 취소할 수 없습니다. 관리자에게 문의해 주세요.',
    )
  }

  // 후불이라 되돌릴 돈이 없다 — 상태만 닫는다.
  order.status = 'CANCELED'
  order.canceledAt = new Date().toISOString()

  saveState(state)
  return order
}
