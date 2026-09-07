import type { CombinationMode } from '@/lib/cart-combination'

/**
 * 장바구니의 «어떻게 살 것인가» — 장바구니 화면과 결제 화면이 같은 값을 봐야 한다.
 *
 *   mode           업체 조합 방식(최저가 조합 / 업체 최소화 / 직접 고르기)
 *   deselectedIds  주문에서 뺀 줄. «선택된 것» 이 아니라 «해제한 것» 을 담는다 — 새로 담긴
 *                  상품이 자동으로 선택되고, 지워진 상품의 id 가 남아도 아무 영향이 없다.
 *
 * `cart.ts` 와 같은 외부 스토어(localStorage). 장바구니에서 «업체 최소화» 를 골라 놓고
 * 결제 화면으로 넘어갔는데 거기서 최저가 조합으로 다시 계산되면 총액이 달라진다.
 * 줄마다 손으로 고른 업체는 장바구니 줄(`CartLine.offerId`)에 있고, 여기는 계획뿐이다.
 */

export interface CartPlan {
  mode: CombinationMode
  deselectedIds: string[]
}

const STORAGE_KEY = 'cpoint.cartPlan'

const DEFAULT: CartPlan = { mode: 'best', deselectedIds: [] }

let snapshot: CartPlan = DEFAULT
let loaded = false

const listeners = new Set<() => void>()

function read(): CartPlan {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<CartPlan>) : null
    if (!parsed) return DEFAULT
    return {
      mode: parsed.mode === 'single' || parsed.mode === 'manual' ? parsed.mode : 'best',
      deselectedIds: Array.isArray(parsed.deselectedIds)
        ? parsed.deselectedIds.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return DEFAULT
  }
}

function write(next: CartPlan): void {
  snapshot = next
  loaded = true
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 저장에 실패해도 이번 세션 동안은 유지된다.
  }
  listeners.forEach(notify => notify())
}

export function subscribeCartPlan(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getCartPlanSnapshot(): CartPlan {
  if (!loaded) {
    snapshot = read()
    loaded = true
  }
  return snapshot
}

/** 서버 스냅샷은 매번 «같은» 참조여야 한다. */
export function getCartPlanServerSnapshot(): CartPlan {
  return DEFAULT
}

export function setCartMode(mode: CombinationMode): void {
  write({ ...getCartPlanSnapshot(), mode })
}

export function setDeselectedIds(deselectedIds: string[]): void {
  write({ ...getCartPlanSnapshot(), deselectedIds })
}
