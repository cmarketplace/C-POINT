import { PRODUCT_IMAGES } from '@/components/Shop/image.data'
import type { CatalogOffer, MarketBenchmark, Product } from '@/components/Shop/product.data'
import { TENANT } from '@/config/tenant'
import type { StorefrontCategoryGroup, StorefrontPage, StorefrontQuery } from '@/lib/semo-feed'

/**
 * 스텁 카탈로그 — **세모 키가 없는 환경의 예시 데이터. 정본이 아니다.**
 *
 * 주문 스텁(`postpaid-mall-stub.ts`)과 같은 이유로 있다: 키 없이 배포된 환경에서 화면이
 * «불러오지 못했습니다» 한 장으로 끝나면 가격 밴드·조합·결제 2경로를 아무도 눌러 볼 수
 * 없다. 그래서 세모 피드와 **같은 모양**의 예시 상품 14건을 여기 둔다.
 *
 * 값은 전부 예시다 — 공급사 이름·단가·낙찰가 기준값 모두. 화면은 스텁 모드일 때
 * «예시 데이터» 표식을 단다(`catalog.ts` 의 `isStubCatalog`). 운영에 세모 키가 들어가면
 * 이 파일은 한 줄도 쓰이지 않는다.
 */

interface StubSupplier {
  id: string
  name: string
  leadDays: number
  trustScore: number
  recentAwards: number
  directPurchase: boolean
  shippingFee: number | null
  freeShippingOver: number | null
}

const SUPPLIERS: Record<string, StubSupplier> = {
  S1: { id: 'sup-hanbit', name: '한빛오피스(주)', leadDays: 2, trustScore: 92, recentAwards: 8, directPurchase: true, shippingFee: 3_000, freeShippingOver: 100_000 },
  S2: { id: 'sup-daehan', name: '대한문구유통', leadDays: 3, trustScore: 88, recentAwards: 5, directPurchase: true, shippingFee: 3_000, freeShippingOver: 50_000 },
  S3: { id: 'sup-seoulmro', name: '서울MRO', leadDays: 1, trustScore: 81, recentAwards: 2, directPurchase: false, shippingFee: null, freeShippingOver: null },
  S4: { id: 'sup-green', name: '그린위생', leadDays: 2, trustScore: 85, recentAwards: 3, directPurchase: true, shippingFee: 3_000, freeShippingOver: 80_000 },
}

/** 한 공급사의 값 — `[공급사키, 기본단가, 구간단가…, 추이방향]` 을 손으로 적기 좋게 접은 모양 */
interface StubOfferSpec {
  supplier: keyof typeof SUPPLIERS
  price: number
  tiers?: { minQuantity: number; price: number }[]
  /** 6개월 추이 방향. 값은 단가에서 결정적으로 만든다. */
  trend: 'down' | 'flat' | 'up'
}

interface StubProductSpec {
  id: string
  name: string
  root: string
  leaf: string
  manufacturer: string
  brand?: string
  unit: string
  spec1?: string
  spec2?: string
  spec3?: string
  img: string
  offers: StubOfferSpec[]
  benchmark: { median: number; samples: number } | null
  mdRank?: number
  popularity: number
}

const CATALOG: StubProductSpec[] = [
  { id: 'st-a4-80', name: '더블에이 A4 복사용지 80g 2,500매 (5권)', root: '사무용품', leaf: '복사용지', manufacturer: '더블에이', unit: '박스', spec1: 'A4 · 80g/㎡', spec3: 'DA-A4-80-2500', img: PRODUCT_IMAGES.placeholder, popularity: 412, mdRank: 2,
    offers: [
      { supplier: 'S1', price: 24_500, tiers: [{ minQuantity: 10, price: 23_200 }, { minQuantity: 50, price: 22_600 }], trend: 'flat' },
      { supplier: 'S2', price: 23_900, tiers: [{ minQuantity: 50, price: 23_400 }], trend: 'down' },
      { supplier: 'S3', price: 25_800, tiers: [{ minQuantity: 10, price: 24_900 }], trend: 'flat' },
    ], benchmark: { median: 25_400, samples: 12 } },
  { id: 'st-toner-d111s', name: '삼성 정품 토너 MLT-D111S 검정', root: '사무용품', leaf: '토너·잉크', manufacturer: '삼성전자', unit: '개', spec1: '1,000매', spec3: 'MLT-D111S', img: PRODUCT_IMAGES.placeholder, popularity: 305, mdRank: 3,
    offers: [
      { supplier: 'S1', price: 62_000, trend: 'flat' },
      { supplier: 'S2', price: 59_800, trend: 'down' },
      { supplier: 'S3', price: 61_500, trend: 'up' },
    ], benchmark: { median: 63_500, samples: 8 } },
  { id: 'st-monami-153', name: '모나미 153 볼펜 검정 0.7mm 12자루', root: '사무용품', leaf: '필기구', manufacturer: '모나미', unit: '다스', spec1: '0.7mm · 검정', img: PRODUCT_IMAGES.placeholder, popularity: 288, mdRank: 6,
    offers: [
      { supplier: 'S1', price: 3_600, trend: 'flat' },
      { supplier: 'S2', price: 3_300, tiers: [{ minQuantity: 20, price: 3_150 }], trend: 'flat' },
      { supplier: 'S3', price: 3_500, trend: 'flat' },
    ], benchmark: { median: 3_400, samples: 15 } },
  { id: 'st-postit-654', name: '포스트잇 654 노랑 76×76mm 12패드', root: '사무용품', leaf: '필기구', manufacturer: '3M', brand: '포스트잇', unit: '팩', spec1: '76×76mm · 100매×12', img: PRODUCT_IMAGES.placeholder, popularity: 141,
    offers: [
      { supplier: 'S2', price: 9_800, trend: 'flat' },
      { supplier: 'S1', price: 10_200, trend: 'up' },
    ], benchmark: { median: 10_500, samples: 6 } },
  { id: 'st-pack-box-50', name: '명절 배송용 완충 포장 박스 50매', root: '사무용품', leaf: '포장·발송', manufacturer: '대성포장', unit: '묶음', spec1: '350×250×200mm', img: PRODUCT_IMAGES.placeholder, popularity: 77, mdRank: 7,
    offers: [
      { supplier: 'S1', price: 22_400, trend: 'flat' },
      { supplier: 'S3', price: 26_000, trend: 'flat' },
    ], benchmark: { median: 24_500, samples: 5 } },
  { id: 'st-kleenex-180', name: '크리넥스 미용티슈 180매 × 6입', root: '위생·청소', leaf: '티슈·타월', manufacturer: '유한킴벌리', brand: '크리넥스', unit: '팩', spec1: '180매 × 6', img: PRODUCT_IMAGES.placeholder, popularity: 233, mdRank: 5,
    offers: [
      { supplier: 'S1', price: 8_900, trend: 'flat' },
      { supplier: 'S4', price: 8_400, tiers: [{ minQuantity: 20, price: 8_100 }], trend: 'down' },
      { supplier: 'S3', price: 9_200, trend: 'flat' },
    ], benchmark: { median: 8_700, samples: 10 } },
  { id: 'st-papercup-65', name: '종이컵 6.5oz 1,000개', root: '위생·청소', leaf: '일회용품', manufacturer: '동원컵', unit: '박스', spec1: '6.5oz · 50개×20줄', img: PRODUCT_IMAGES.ware, popularity: 198,
    offers: [
      { supplier: 'S1', price: 21_000, trend: 'up' },
      { supplier: 'S4', price: 19_800, trend: 'flat' },
    ], benchmark: { median: 19_200, samples: 6 } },
  { id: 'st-nitrile-m', name: '니트릴 장갑 M 100매', root: '위생·청소', leaf: '보호구', manufacturer: '유니글러브', unit: '박스', spec1: 'M · 파우더프리', img: PRODUCT_IMAGES.ppe, popularity: 264, mdRank: 4,
    offers: [
      { supplier: 'S1', price: 9_900, trend: 'flat' },
      { supplier: 'S2', price: 9_500, trend: 'flat' },
      { supplier: 'S4', price: 8_700, tiers: [{ minQuantity: 10, price: 8_400 }], trend: 'down' },
    ], benchmark: { median: 9_100, samples: 9 } },
  { id: 'st-kf94-50', name: 'KF94 마스크 대형 50매 (개별포장)', root: '위생·청소', leaf: '보호구', manufacturer: '웰킵스', unit: '박스', spec1: 'KF94 · 대형 · 개별포장', img: PRODUCT_IMAGES.ppe, popularity: 176,
    offers: [
      { supplier: 'S4', price: 14_000, trend: 'down' },
      { supplier: 'S2', price: 14_800, trend: 'down' },
    ], benchmark: { median: 15_900, samples: 11 } },
  { id: 'st-floor-cleaner-4l', name: '사무실 바닥 청소용 중성세제 4L', root: '위생·청소', leaf: '세제·소독', manufacturer: '유한크로락스', unit: '통', spec1: '4L · 중성', img: PRODUCT_IMAGES.color, popularity: 64,
    offers: [
      { supplier: 'S4', price: 12_500, trend: 'flat' },
      { supplier: 'S1', price: 13_200, trend: 'flat' },
    ], benchmark: { median: 13_000, samples: 4 } },
  { id: 'st-gift-nut-30', name: '추석 선물세트 · 견과 5종 (30인 단체)', root: '명절·선물', leaf: '선물세트', manufacturer: '자연담은', unit: '세트', spec1: '아몬드·호두·캐슈·피칸·마카다미아 각 200g', img: PRODUCT_IMAGES.placeholder, popularity: 96, mdRank: 1,
    offers: [
      { supplier: 'S2', price: 39_500, trend: 'flat' },
      { supplier: 'S1', price: 41_000, trend: 'flat' },
      { supplier: 'S3', price: 46_000, trend: 'up' },
    ], benchmark: { median: 44_000, samples: 7 } },
  { id: 'st-gift-hangwa', name: '한과 선물세트 프리미엄 (유과·약과·정과)', root: '명절·선물', leaf: '선물세트', manufacturer: '담양한과', unit: '세트', spec1: '1.2kg · 3단', img: PRODUCT_IMAGES.placeholder, popularity: 58, mdRank: 8,
    offers: [
      { supplier: 'S2', price: 53_000, trend: 'flat' },
      { supplier: 'S1', price: 56_000, trend: 'flat' },
      { supplier: 'S3', price: 61_000, trend: 'flat' },
    ], benchmark: { median: 58_000, samples: 5 } },
  { id: 'st-beaker-500', name: '파이렉스 비커 500mL (눈금)', root: '실험·연구실', leaf: '초자', manufacturer: 'Corning', brand: 'PYREX', unit: '개', spec1: '500mL · 저형', img: PRODUCT_IMAGES.glass, popularity: 121,
    offers: [
      { supplier: 'S3', price: 6_800, trend: 'flat' },
      { supplier: 'S1', price: 7_200, trend: 'flat' },
    ], benchmark: { median: 7_000, samples: 9 } },
  { id: 'st-ethanol-95', name: '에탄올 95% 시약급 4L', root: '실험·연구실', leaf: '시약', manufacturer: '대정화금', unit: '병', spec1: '95% · 4L', spec2: '64-17-5', img: PRODUCT_IMAGES.reagent, popularity: 152,
    offers: [
      { supplier: 'S3', price: 18_500, trend: 'down' },
      { supplier: 'S1', price: 19_900, trend: 'flat' },
    ], benchmark: { median: 19_200, samples: 13 } },
]

/** 기준일 — 스텁이라 고정값. 세모 가격밴드 데이터의 실제 끝(2026-04-22)이 아니라 «예시» 임을 밝힌다. */
const BENCHMARK_AS_OF = '2026-08-31'
const BENCHMARK_WINDOW_DAYS = 90

/** 단가와 방향에서 6개월 추이를 결정적으로 만든다(무작위 없음 — 새로고침마다 바뀌면 «데이터» 로 안 읽힌다). */
function trendOf(price: number, direction: StubOfferSpec['trend']): number[] {
  const step = Math.max(50, Math.round(price * 0.012 / 50) * 50)
  const signs: Record<StubOfferSpec['trend'], number[]> = {
    down: [5, 4, 3, 2, 1, 0],
    flat: [0, 0, 1, 1, 0, 0],
    up: [0, 1, 2, 3, 4, 5],
  }
  return signs[direction].map(k => (direction === 'up' ? price - (5 - k) * step : price + k * step))
}

function offerId(productId: string, supplier: string): string {
  return `${productId}:${supplier}`
}

function buildOffers(spec: StubProductSpec): CatalogOffer[] {
  const ranked = [...spec.offers].sort((a, b) => a.price - b.price || a.supplier.localeCompare(b.supplier))
  return ranked.map((offer, index) => {
    const supplier = SUPPLIERS[offer.supplier]
    return {
      offerId: offerId(spec.id, offer.supplier),
      price: offer.price,
      priceRank: index + 1,
      supplierId: supplier.id,
      supplierName: supplier.name,
      leadDays: supplier.leadDays,
      minQuantity: null,
      tiers: offer.tiers ?? [],
      trend: trendOf(offer.price, offer.trend),
      trustScore: supplier.trustScore,
      recentAwards: supplier.recentAwards,
      directPurchase: supplier.directPurchase,
      shippingFee: supplier.shippingFee,
      freeShippingOver: supplier.freeShippingOver,
    }
  })
}

function buildBenchmark(spec: StubProductSpec): MarketBenchmark | null {
  if (!spec.benchmark) return null
  return {
    medianPrice: spec.benchmark.median,
    sampleCount: spec.benchmark.samples,
    windowDays: BENCHMARK_WINDOW_DAYS,
    asOf: BENCHMARK_AS_OF,
  }
}

const CAS_RE = /^\d{2,7}-\d{2}-\d$/

function toProduct(spec: StubProductSpec, withOffers: boolean): Product {
  const offers = buildOffers(spec)
  const prices = offers.map(offer => offer.price)
  const isCas = Boolean(spec.spec2 && CAS_RE.test(spec.spec2))
  const specLine = [spec.spec1, spec.spec2, spec.spec3].filter(Boolean).join(' · ')

  return {
    id: spec.id,
    name: spec.name,
    codeLabel: isCas ? 'CAS' : spec.spec3 ? '품번' : '',
    code: isCas ? spec.spec2! : spec.spec3 ?? '',
    basePrice: Math.min(...prices),
    img: spec.img,
    tag: spec.leaf,
    categoryGroup: spec.root,
    desc: [spec.manufacturer, specLine].filter(Boolean).join(' · '),
    manufacturer: spec.manufacturer,
    brand: spec.brand ?? '',
    unit: spec.unit,
    spec1: spec.spec1 ?? '',
    spec2: spec.spec2 ?? '',
    spec3: spec.spec3 ?? '',
    features: [...TENANT.productBadges],
    offerCount: offers.length,
    categoryId: `cat:${spec.root}/${spec.leaf}`,
    maxPrice: Math.max(...prices),
    benchmark: buildBenchmark(spec),
    mdRank: spec.mdRank ?? null,
    popularity: spec.popularity,
    ...(withOffers ? { offers } : {}),
  }
}

function matches(spec: StubProductSpec, q: string): boolean {
  const hay = [spec.name, spec.manufacturer, spec.brand, spec.leaf, spec.root, spec.spec1, spec.spec2, spec.spec3]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every(token => hay.includes(token))
}

export function stubCategories(): StorefrontCategoryGroup[] {
  const roots = new Map<string, Map<string, number>>()
  for (const spec of CATALOG) {
    const leaves = roots.get(spec.root) ?? new Map<string, number>()
    leaves.set(spec.leaf, (leaves.get(spec.leaf) ?? 0) + 1)
    roots.set(spec.root, leaves)
  }
  return [...roots.entries()].map(([root, leaves]) => ({
    rootCategoryId: `root:${root}`,
    rootCategoryName: root,
    itemCount: [...leaves.values()].reduce((sum, n) => sum + n, 0),
    children: [...leaves.entries()].map(([leaf, count]) => ({
      categoryId: `cat:${root}/${leaf}`,
      categoryName: leaf,
      itemCount: count,
    })),
  }))
}

export function stubPage(query: StorefrontQuery = {}): StorefrontPage {
  const rows = CATALOG.filter(spec => {
    if (query.categoryId && `cat:${spec.root}/${spec.leaf}` !== query.categoryId) return false
    if (query.rootCategoryId && `root:${spec.root}` !== query.rootCategoryId) return false
    if (query.q && !matches(spec, query.q)) return false
    return true
  })

  const products = rows.map(spec => toProduct(spec, false))
  switch (query.sort) {
    case 'price_asc':
      products.sort((a, b) => a.basePrice - b.basePrice)
      break
    case 'price_desc':
      products.sort((a, b) => b.basePrice - a.basePrice)
      break
    case 'name':
      products.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      break
    default:
      // 추천순 = MD 순위 → 주문 많은 순
      products.sort(
        (a, b) =>
          (a.mdRank ?? 999) - (b.mdRank ?? 999) || (b.popularity ?? 0) - (a.popularity ?? 0),
      )
  }

  const offset = query.offset ?? 0
  const limit = query.limit ?? 120
  return { items: products.slice(offset, offset + limit), total: products.length }
}

export function stubProduct(itemId: string, withOffers: boolean): Product | null {
  const spec = CATALOG.find(row => row.id === itemId)
  return spec ? toProduct(spec, withOffers) : null
}
