/**
 * 브라우저에서 주문·취소를 낸다 — `/api/shop/orders` 로만 간다.
 *
 * 원장을 직접 부르지 않는 이유는 신원이다. 「누가」는 서버 세션이 정하고, 세모 연동
 * 후에는 파트너 키도 서버에만 있다.
 */

import type { Product } from '@/components/Shop/product.data'
import type { OrderShipTo, StorefrontOrder } from '@/lib/order-types'

export interface PlacedOrder {
  orderNo: string
  status: string
}

/**
 * 재시도 키 — 같은 클릭에서 난 실패를 다시 보낼 때 **같은 키**를 써야 주문이 한 건만
 * 생긴다. `crypto.randomUUID` 는 보안 컨텍스트(https·localhost)에서만 있다.
 */
export function newOrderKey(): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  return `cart-${Date.now().toString(36)}-${random}`
}

/** 장바구니 줄 → 주문 줄. 스텁 단계에서는 단가 스냅샷도 함께 간다(서버 라우트 주석 참고). */
export function toOrderLine(line: { product: Product; quantity: number }) {
  return {
    itemId: line.product.id,
    name: line.product.name,
    spec: [line.product.spec1, line.product.spec2].filter(Boolean).join(' ') || null,
    unit: line.product.unit || null,
    quantity: line.quantity,
    unitPrice: line.product.basePrice,
  }
}

/** 로그인이 필요한 실패 — 장바구니가 로그인 문으로 안내할 수 있게 따로 가른다. */
export class LoginRequiredError extends Error {
  constructor() {
    super('주문하려면 씨마켓 계정으로 로그인해 주세요.')
    this.name = 'LoginRequiredError'
  }
}

export async function placeOrder(input: {
  shipTo: OrderShipTo
  items: ReturnType<typeof toOrderLine>[]
  clientOrderKey: string
}): Promise<PlacedOrder> {
  const response = await fetch('/api/shop/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (response.status === 401) throw new LoginRequiredError()

  const payload = (await response.json().catch(() => null)) as {
    order?: PlacedOrder
    message?: string
  } | null

  if (!response.ok || !payload?.order) {
    // 서버가 준 문구를 그대로 보여 준다 — 배송지 형식 오류처럼 담당자가 고칠 수 있는
    // 말이 여기 담긴다.
    throw new Error(payload?.message ?? '주문을 등록하지 못했습니다.')
  }

  return payload.order
}

export async function cancelOrder(orderNo: string): Promise<StorefrontOrder> {
  const response = await fetch(`/api/shop/orders/${encodeURIComponent(orderNo)}/cancel`, {
    method: 'POST',
  })

  const payload = (await response.json().catch(() => null)) as {
    order?: StorefrontOrder
    message?: string
  } | null

  if (!response.ok || !payload?.order) {
    throw new Error(payload?.message ?? '주문을 취소하지 못했습니다.')
  }

  return payload.order
}

/* ── 배송지 기억 — cart.ts 와 같은 외부 스토어 ───────────────────────── */

const SHIP_TO_KEY = 'cpoint.shipTo'

export const EMPTY_SHIP_TO: OrderShipTo = { name: '', zip: '', address: '', tel: null }

/**
 * 마지막 배송지. 이 몰은 모두 개방이라 고정 사업장 목록이 없고 주문자가 직접 적는다 —
 * 그 값을 기억해 두면 두 번째 주문부터는 확인만 하면 된다.
 *
 * `useState`+effect 로 복원하면 setState-in-effect 가 되고, 초기값에서 바로 읽으면
 * 서버 렌더에 localStorage 가 없어 하이드레이션이 깨진다 — 그래서 `cart.ts` 와 같은
 * `useSyncExternalStore` 외부 스토어다. localStorage 가 막힌 환경(사파리 프라이빗
 * 등)에서는 이번 세션 동안만 유지된다.
 */
let shipToSnapshot: OrderShipTo = EMPTY_SHIP_TO
let shipToLoaded = false

const shipToListeners = new Set<() => void>()

function readShipToStorage(): OrderShipTo {
  try {
    const raw = window.localStorage.getItem(SHIP_TO_KEY)
    const parsed = raw ? (JSON.parse(raw) as OrderShipTo) : null
    if (!parsed || typeof parsed.name !== 'string' || typeof parsed.address !== 'string') {
      return EMPTY_SHIP_TO
    }
    return {
      name: parsed.name,
      zip: typeof parsed.zip === 'string' ? parsed.zip : '',
      address: parsed.address,
      tel: typeof parsed.tel === 'string' && parsed.tel ? parsed.tel : null,
    }
  } catch {
    return EMPTY_SHIP_TO
  }
}

export function subscribeShipTo(listener: () => void): () => void {
  shipToListeners.add(listener)
  return () => shipToListeners.delete(listener)
}

export function getShipToSnapshot(): OrderShipTo {
  if (!shipToLoaded) {
    shipToSnapshot = readShipToStorage()
    shipToLoaded = true
  }
  return shipToSnapshot
}

/** 서버 스냅샷은 매번 «같은» 참조여야 한다. 새 객체를 주면 무한 렌더가 된다. */
export function getShipToServerSnapshot(): OrderShipTo {
  return EMPTY_SHIP_TO
}

export function setShipTo(next: OrderShipTo): void {
  shipToSnapshot = next
  shipToLoaded = true
  try {
    window.localStorage.setItem(SHIP_TO_KEY, JSON.stringify(next))
  } catch {
    // 저장에 실패해도 화면 상태는 유지한다 — 주문은 그대로 진행된다.
  }
  shipToListeners.forEach(notify => notify())
}
