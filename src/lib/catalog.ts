import type { Product } from '@/components/Shop/product.data'
import { upcomingSeasons, type SeasonEvent } from '@/config/seasons'
import { stubCategories, stubPage, stubProduct } from '@/lib/catalog-stub'
import { isSemoConfigured } from '@/lib/semo-api'
import * as semo from '@/lib/semo-feed'

export { SemoFeedError } from '@/lib/semo-feed'
export type {
  StorefrontCategoryGroup,
  StorefrontPage,
  StorefrontQuery,
  StorefrontSort,
} from '@/lib/semo-feed'

/**
 * 카탈로그 — 화면이 상품을 받는 **유일한 창구**. 서버 전용.
 *
 * `orders.ts` 와 같은 이음새다: 세모 키가 있으면 세모 피드(`semo-feed.ts`)가 정본이고,
 * 없으면 예시 카탈로그(`catalog-stub.ts`)가 자리를 지킨다. 화면은 어느 쪽인지 모른다 —
 * 다만 스텁일 때 «예시 데이터» 표식을 달 수 있게 `isStubCatalog()` 만 내준다.
 *
 * `SHOP_DEMO_CATALOG=1` 이면 키가 있어도 스텁을 쓴다 — 세모 `c-point` 스토어프론트에
 * 승인 품목이 0건인 동안 화면을 채워 보는 용도다. **운영 환경변수에는 넣지 않는다.**
 */
export function isStubCatalog(): boolean {
  return !isSemoConfigured() || process.env.SHOP_DEMO_CATALOG === '1'
}

export async function fetchStorefrontCategories() {
  if (isStubCatalog()) return stubCategories()
  return semo.fetchStorefrontCategories()
}

export async function fetchStorefrontPage(query: semo.StorefrontQuery = {}) {
  if (isStubCatalog()) return stubPage(query)
  return semo.fetchStorefrontPage(query)
}

/** 상품 한 건, 오퍼 없이. 목록·추천용. */
export async function fetchStorefrontProduct(itemId: string): Promise<Product | null> {
  if (isStubCatalog()) return stubProduct(itemId, false)
  return semo.fetchStorefrontProduct(itemId)
}

/**
 * 상품 한 건 + 공급사별 값.
 *
 * 상세와 장바구니가 쓴다. 세모 모드에서는 상품·오퍼 두 번을 부른다(예전 상세와 같다).
 */
export async function fetchProductWithOffers(itemId: string): Promise<Product | null> {
  if (isStubCatalog()) return stubProduct(itemId, true)

  const product = await semo.fetchStorefrontProduct(itemId)
  if (!product) return null
  const offers = await semo.fetchItemOffers(itemId)
  return { ...product, offers, offerCount: Math.max(product.offerCount, offers.length) }
}

/**
 * 품목 id 목록 → 오퍼까지 붙은 상품(장바구니·견적용).
 *
 * 세모에 id 목록 필터가 없어 단건을 나눠 부른다. 장바구니는 원래 몇 줄 수준이라
 * 이 편이 목록 전체를 받는 것보다 훨씬 싸다. 상한을 두어 폭주를 막는다.
 */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids)].filter(Boolean).slice(0, 60)
  const results = await Promise.all(unique.map(id => fetchProductWithOffers(id)))
  return results.filter((item): item is Product => Boolean(item))
}

export async function fetchRelatedProducts(categoryId: string | null | undefined, limit = 12) {
  if (isStubCatalog()) return stubPage({ categoryId: categoryId ?? undefined, limit }).items
  return semo.fetchRelatedProducts(categoryId, limit)
}

/* ── 공급사 실명 가림 ─────────────────────────────────────────────── */

/**
 * 비로그인 손님에게는 공급사 실명을 내려보내지 않는다.
 *
 * 이 몰은 열람이 공개다. 실명 단가가 로그인 없이 그대로 보이면 공급사 입장에서는
 * 경쟁사가 내 단가를 무료로 보는 셈이라 반발 요인이 된다. 밴드(점의 위치)와 «N곳» 은
 * 보여 주되 이름은 로그인 뒤에만. 가리는 것은 **서버**에서 한다 — 클라이언트에서 감추면
 * 응답에 이름이 실려 있어 소스보기로 보인다.
 */
export function maskForViewer(product: Product, loggedIn: boolean): Product {
  const offers = product.offers ?? []
  if (loggedIn || offers.length === 0) return { ...product, namesMasked: false }

  const hadNames = offers.some(offer => offer.supplierName || offer.supplierId)
  return {
    ...product,
    namesMasked: hadNames,
    offers: offers.map(offer => ({ ...offer, supplierId: null, supplierName: null })),
  }
}

/* ── 메인 큐레이션 ────────────────────────────────────────────────── */

export interface SeasonSection {
  event: SeasonEvent
  products: Product[]
}

export interface Curation {
  /** 히어로 자리의 시즌(가장 가까운 «featured»). 상품이 0건이면 null. */
  featuredSeason: SeasonSection | null
  /** 그 밖의 다가오는 시즌 — 칩으로만 보여 준다. */
  otherSeasons: SeasonEvent[]
  /** MD 픽. `mdRank` 가 있는 상품만, 없으면 추천순 앞부분. */
  mdPicks: Product[]
  /** 낙찰가 대비 저렴한 순. 기준값이 있는 상품만. */
  byBenchmark: Product[]
  /** 공공기관 주문 많은 순. `popularity` 가 있는 상품만 — 없으면 빈 배열이고 탭이 빠진다. */
  popular: Product[]
}

const CURATION_POOL = 40
const SHELF = 8

/**
 * 메인이 필요한 묶음을 한 번에.
 *
 * 세모에 «MD 픽» 같은 큐레이션 API 는 없다. 그래서 추천순 한 쪽(40건)을 받아 그 안에서
 * 세 축으로 나눈다 — 값이 없는 축은 빈 배열로 돌려주고 화면이 그 탭을 그리지 않는다.
 * 시즌 상품은 시즌 키워드로 검색한다(첫 키워드가 0건이면 다음 키워드).
 */
export async function fetchCuration(): Promise<Curation> {
  const seasons = upcomingSeasons()
  const featured = seasons.find(season => season.featured) ?? seasons[0] ?? null

  const [pool, seasonProducts] = await Promise.all([
    fetchStorefrontPage({ limit: CURATION_POOL }).then(page => page.items),
    featured ? searchSeason(featured) : Promise.resolve<Product[]>([]),
  ])

  const ranked = pool.filter(product => typeof product.mdRank === 'number')
  const mdPicks = (ranked.length > 0
    ? ranked.sort((a, b) => (a.mdRank ?? 0) - (b.mdRank ?? 0))
    : pool
  ).slice(0, SHELF)

  const byBenchmark = pool
    .filter(product => product.benchmark && product.benchmark.medianPrice > 0)
    .sort(
      (a, b) =>
        a.basePrice / a.benchmark!.medianPrice - b.basePrice / b.benchmark!.medianPrice,
    )
    .slice(0, SHELF)

  const popular = pool
    .filter(product => typeof product.popularity === 'number')
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, SHELF)

  return {
    featuredSeason:
      featured && seasonProducts.length > 0 ? { event: featured, products: seasonProducts } : null,
    otherSeasons: seasons.filter(season => season.key !== featured?.key),
    mdPicks,
    byBenchmark,
    popular,
  }
}

async function searchSeason(event: SeasonEvent): Promise<Product[]> {
  const found: Product[] = []
  for (const keyword of event.keywords) {
    const page = await fetchStorefrontPage({ q: keyword, limit: 6 })
    for (const product of page.items) {
      if (!found.some(item => item.id === product.id)) found.push(product)
    }
    if (found.length >= 3) break
  }
  return found.slice(0, 3)
}
