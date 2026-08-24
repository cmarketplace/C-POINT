/**
 * 북마크 저장소.
 *
 * `useSyncExternalStore` 용 외부 스토어로 만든 이유가 있다. 북마크는 «저장» 이라
 * localStorage 에 남아야 하는데, 서버 렌더에는 localStorage 가 없다. effect 로
 * 뒤늦게 채우면 setState-in-effect 가 되고(React Compiler 가 막는다), 초기값에서
 * 바로 읽으면 서버 결과와 달라져 하이드레이션이 깨진다.
 *
 * 외부 스토어는 이 경우를 위해 있는 API 다 — 하이드레이션 동안에는
 * `getServerSnapshot`(빈 목록)을 쓰고, 끝난 뒤 클라이언트 스냅샷으로 갈아탄다.
 */

const STORAGE_KEY = 'cpoint.bookmarks'

/** 서버 스냅샷은 매번 «같은» 참조여야 한다. 새 배열을 주면 무한 렌더가 된다. */
const EMPTY: string[] = []

let snapshot: string[] = EMPTY
let loaded = false

const listeners = new Set<() => void>()

function readStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null

    // 손으로 고쳤거나 다른 버전이 쓴 값이 들어 있을 수 있다. 모양이 아니면 버린다.
    if (!Array.isArray(parsed)) return EMPTY

    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    // 사파리 프라이빗 모드처럼 localStorage 가 막힌 환경이 있다.
    // 북마크는 부가 기능이라 못 읽어도 쇼핑몰은 그대로 동작해야 한다.
    return EMPTY
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  // 다른 탭에서 담은 북마크도 따라오게 한다. 같은 쇼핑몰을 두 탭에 띄워 두는 일이 흔하다.
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

export function getSnapshot(): string[] {
  if (!loaded) {
    snapshot = readStorage()
    loaded = true
  }

  return snapshot
}

export function getServerSnapshot(): string[] {
  return EMPTY
}

export function toggleBookmarkId(productId: string): void {
  const current = getSnapshot()

  snapshot = current.includes(productId)
    ? current.filter(id => id !== productId)
    : [...current, productId]

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // 저장에 실패해도 화면 상태는 유지한다 — 이번 세션 동안은 북마크가 동작한다.
  }

  listeners.forEach(notify => notify())
}
