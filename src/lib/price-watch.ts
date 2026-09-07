/**
 * 관심 가격 — «이 가격 아래로 내려가면».
 *
 * 소모품은 «지금 살까, 기다릴까» 가 반복된다. 상품마다 관심 단가를 적어 두고, 다음에
 * 목록·상세를 열었을 때 현재가가 그 아래면 표시한다. `bookmarks.ts` 와 같은 외부 스토어다.
 *
 * ⚠️ **알림 발송은 아직 없다** — 저장은 이 브라우저(localStorage)에만 되고, 메일·문자로
 * 보내는 축은 세모/씨마켓 알림 인프라에 붙일 일이다. 화면은 그 사실을 숨기지 않는다.
 */

export interface PriceWatch {
  productId: string
  targetPrice: number
  createdAt: string
}

const STORAGE_KEY = 'cpoint.priceWatch'

const EMPTY: PriceWatch[] = []

let snapshot: PriceWatch[] = EMPTY
let loaded = false

const listeners = new Set<() => void>()

function readStorage(): PriceWatch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (!Array.isArray(parsed)) return EMPTY
    const rows = parsed.filter(
      (row): row is PriceWatch =>
        typeof row?.productId === 'string' && typeof row?.targetPrice === 'number',
    )
    return rows.length > 0 ? rows : EMPTY
  } catch {
    return EMPTY
  }
}

function write(next: PriceWatch[]): void {
  snapshot = next.length > 0 ? next : EMPTY
  loaded = true
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // 저장에 실패해도 이번 세션 동안은 유지된다.
  }
  listeners.forEach(notify => notify())
}

export function subscribePriceWatch(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPriceWatchSnapshot(): PriceWatch[] {
  if (!loaded) {
    snapshot = readStorage()
    loaded = true
  }
  return snapshot
}

export function getPriceWatchServerSnapshot(): PriceWatch[] {
  return EMPTY
}

export function setPriceWatch(productId: string, targetPrice: number): void {
  const rest = getPriceWatchSnapshot().filter(row => row.productId !== productId)
  write([...rest, { productId, targetPrice, createdAt: new Date().toISOString() }])
}

export function clearPriceWatch(productId: string): void {
  write(getPriceWatchSnapshot().filter(row => row.productId !== productId))
}
