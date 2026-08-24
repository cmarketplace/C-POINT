import type { Product } from '@/components/Shop/product.data'

/**
 * 장바구니 저장소.
 *
 * KCL 몰의 장바구니는 `useState` 라 **새로고침하면 비었다.** 사무용품을 서른 줄 담다가
 * 상세를 새 탭이 아닌 같은 탭에서 열고 뒤로 오면 전부 사라진다 — 담는 데 오래 걸리는
 * 화면일수록 이 손실이 크다. 그래서 여기서는 남긴다.
 *
 * 구조는 `bookmarks.ts` 와 같은 외부 스토어다. 이유도 같다 — 서버 렌더에는
 * localStorage 가 없어서, effect 로 뒤늦게 채우면 setState-in-effect 가 되고
 * 초기값에서 바로 읽으면 하이드레이션이 깨진다.
 *
 * **담긴 상품 정보를 통째로 저장한다.** id 만 남기면 장바구니를 그릴 때마다 피드를
 * 다시 불러야 하고, 그동안 화면이 비어 보인다. 대신 값이 오래되면 그만큼 낡은 가격을
 * 보여 주게 되므로, 장바구니 화면이 열릴 때 한 번 최신값으로 맞춘다(`syncPrices`).
 */

export interface CartLine {
  product: Product
  quantity: number
}

const STORAGE_KEY = 'cpoint.cart'

/** 서버 스냅샷은 매번 «같은» 참조여야 한다. 새 배열을 주면 무한 렌더가 된다. */
const EMPTY: CartLine[] = []

let snapshot: CartLine[] = EMPTY
let loaded = false

const listeners = new Set<() => void>()

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) return false
  const line = value as { product?: unknown; quantity?: unknown }
  if (typeof line.quantity !== 'number' || line.quantity <= 0) return false
  const product = line.product as { id?: unknown; name?: unknown } | undefined
  return typeof product?.id === 'string' && typeof product.name === 'string'
}

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null

    // 손으로 고쳤거나 다른 버전이 쓴 값이 들어 있을 수 있다. 모양이 아니면 버린다.
    if (!Array.isArray(parsed)) return EMPTY

    const lines = parsed.filter(isCartLine)
    return lines.length > 0 ? lines : EMPTY
  } catch {
    // 사파리 프라이빗 모드처럼 localStorage 가 막힌 환경이 있다.
    // 못 읽어도 쇼핑몰은 그대로 동작해야 한다 — 이번 세션 동안만 유지된다.
    return EMPTY
  }
}

function write(next: CartLine[]): void {
  snapshot = next.length > 0 ? next : EMPTY
  loaded = true

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // 저장에 실패해도 화면 상태는 유지한다.
  }

  listeners.forEach(notify => notify())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  // 다른 탭에서 담은 것도 따라오게 한다. 같은 쇼핑몰을 두 탭에 띄워 두는 일이 흔하다.
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return

    snapshot = readStorage()
    listeners.forEach(notify => notify())
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

export function getSnapshot(): CartLine[] {
  if (!loaded) {
    snapshot = readStorage()
    loaded = true
  }

  return snapshot
}

export function getServerSnapshot(): CartLine[] {
  return EMPTY
}

export function addLine(product: Product, quantity = 1): void {
  const current = getSnapshot()
  const existing = current.find(line => line.product.id === product.id)

  write(
    existing
      ? current.map(line =>
          line.product.id === product.id
            ? // 담긴 값도 최신 상품 정보로 갈아 끼운다 — 가격이 바뀌었을 수 있다.
              { product, quantity: line.quantity + quantity }
            : line,
        )
      : [...current, { product, quantity }],
  )
}

export function removeLine(productId: string): void {
  write(getSnapshot().filter(line => line.product.id !== productId))
}

export function setLineQuantity(productId: string, quantity: number): void {
  if (quantity <= 0) {
    removeLine(productId)
    return
  }

  write(
    getSnapshot().map(line =>
      line.product.id === productId ? { ...line, quantity } : line,
    ),
  )
}

export function clearLines(): void {
  write([])
}

/**
 * 담아 둔 값을 피드의 최신값으로 맞춘다.
 *
 * 저장된 상품 정보는 «담던 순간» 의 사본이라 시간이 지나면 가격·품명이 어긋난다.
 * 사라진 품목(더 이상 이 몰에 승인되지 않은 것)은 장바구니에서 함께 내린다 —
 * 주문할 수 없는 줄을 남겨 두면 합계만 틀리게 만든다.
 *
 * 실패하면 아무것도 하지 않는다. 낡은 값이라도 보여 주는 편이 빈 장바구니보다 낫다.
 */
export async function syncPrices(): Promise<void> {
  const current = getSnapshot()
  if (current.length === 0) return

  try {
    const ids = current.map(line => line.product.id)
    const res = await fetch(`/api/shop/items?ids=${encodeURIComponent(ids.join(','))}`)
    if (!res.ok) return

    const data = (await res.json()) as { items?: Product[] }
    const fresh = new Map((data.items ?? []).map(item => [item.id, item]))
    if (fresh.size === 0) return

    const next = current
      .filter(line => fresh.has(line.product.id))
      .map(line => ({ product: fresh.get(line.product.id)!, quantity: line.quantity }))

    // 바뀐 게 없으면 쓰지 않는다 — 매번 쓰면 다른 탭이 계속 깨어난다.
    if (JSON.stringify(next) === JSON.stringify(current)) return

    write(next)
  } catch {
    // 네트워크 실패. 담긴 값을 그대로 둔다.
  }
}
