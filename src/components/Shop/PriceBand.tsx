'use client'

import type { CatalogOffer, MarketBenchmark } from '@/components/Shop/product.data'
import { bandPosition, bandRange, supplierLabel, unitPriceAt } from '@/lib/offer-pricing'

interface PriceBandProps {
  offers: readonly CatalogOffer[]
  quantity: number
  benchmark: MarketBenchmark | null | undefined
  /** 자동 선정(최저가) 오퍼 — 크게 그린다. */
  bestOfferId: string | null
  /** 손님이 직접 고른 오퍼 — 있으면 표시한다. */
  selectedOfferId: string | null
  onSelect?: (offerId: string) => void
}

const won = (n: number) => n.toLocaleString('ko-KR')

/**
 * 가격 밴드 — 공급사 단가는 점, 최근 낙찰가 중앙값은 선.
 *
 * 목록으로 나열하면 최저가만 보고 끝난다. 밴드는 «이 몰 가격이 시장 어디쯤인지» 를
 * 한눈에 보여 준다. 기준선(낙찰가)은 씨마켓 공고 실거래에서만 오고, 없으면 그리지 않는다.
 *
 * 점 색은 브랜드 파랑 하나다(공급사별 색을 나눠 봐야 «어느 점이 누구» 는 라벨이 말한다).
 * 자동 선정 오퍼는 크게, 손으로 고른 오퍼는 진한 링으로 구분한다.
 */
export default function PriceBand({
  offers,
  quantity,
  benchmark,
  bestOfferId,
  selectedOfferId,
  onSelect,
}: PriceBandProps) {
  if (offers.length === 0) return null

  const range = bandRange(offers, quantity, benchmark)
  const priced = offers
    .map(offer => ({ offer, price: unitPriceAt(offer, quantity) }))
    .sort((a, b) => a.price - b.price)
  // 기준선 라벨은 선 위에 놓이되, 밴드 끝에 가까우면 안쪽으로 눕혀 잘리지 않게 한다.
  const medianPos = benchmark ? bandPosition(benchmark.medianPrice, range) : 50
  const medianLabelShift =
    medianPos > 70 ? '-translate-x-full' : medianPos < 30 ? 'translate-x-0' : '-translate-x-1/2'

  return (
    <div className="relative mx-2 h-[72px]">

      {/* 트랙 */}
      <div aria-hidden="true" className="bg-bg-secondary absolute inset-x-0 top-[34px] h-2 rounded-full" />

      {/* 낙찰가 기준선 */}
      {benchmark && (
        <div
          className="absolute top-[22px] h-8 w-0.5 -translate-x-1/2 bg-text"
          style={{ left: `${medianPos}%` }}
        >
          <span className={`text-text absolute -top-4 left-1/2 ${medianLabelShift} text-[11px] font-semibold whitespace-nowrap`}>
            낙찰가 중앙값 {won(benchmark.medianPrice)}원
          </span>
        </div>
      )}

      {/* 공급사 점 */}
      {priced.map(({ offer, price }) => {
        const isBest = offer.offerId === bestOfferId
        const isSelected = offer.offerId === selectedOfferId && !isBest
        const size = isBest ? 'h-[22px] w-[22px] top-[27px]' : 'h-[16px] w-[16px] top-[30px]'
        const ring = isBest
          ? 'ring-4 ring-blue-tint-2'
          : isSelected
            ? 'ring-4 ring-highlight-soft bg-highlight'
            : ''
        return (
          <button
            key={offer.offerId}
            type="button"
            onClick={onSelect ? () => onSelect(offer.offerId) : undefined}
            title={`${supplierLabel(offer)} ${won(price)}원`}
            aria-label={`${supplierLabel(offer)} ${won(price)}원${isBest ? ' (자동 선정)' : ''}`}
            className={`absolute -translate-x-1/2 rounded-full border-2 border-white bg-primary transition-[left] duration-300 ${size} ${ring} ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ left: `${bandPosition(price, range)}%` }}
          >
            <span
              className={`absolute top-full left-1/2 mt-1.5 -translate-x-1/2 text-[11px] whitespace-nowrap ${
                isBest ? 'text-text font-semibold' : 'text-muted'
              }`}
            >
              {offer.supplierName ? offer.supplierName.slice(0, 4) : `공급처 ${offer.priceRank}`}
              {' '}
              {won(price)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
