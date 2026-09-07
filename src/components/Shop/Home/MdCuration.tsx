'use client'

import { useState } from 'react'
import Link from 'next/link'

import ProductCard from '@/components/Shop/ProductCard'
import type { Product } from '@/components/Shop/product.data'

interface MdCurationProps {
  mdPicks: Product[]
  byBenchmark: Product[]
  popular: Product[]
}

/**
 * MD 큐레이션 — 정렬 축에 씨마켓만 가진 것을 둔다.
 *
 *   MD 픽                 사람이 고른 순서(`mdRank`)
 *   낙찰가 대비 저렴한 순   씨마켓 공고 실거래 대비 — 다른 몰엔 이 축이 없다
 *   공공기관 주문 많은 순   최근 90일 주문 수
 *
 * 값이 없는 축은 탭이 아예 안 그려진다. 빈 탭을 보여 주는 것보다 없는 편이 낫다.
 */
export default function MdCuration({ mdPicks, byBenchmark, popular }: MdCurationProps) {
  const tabs = [
    { key: 'md', label: 'MD 픽', items: mdPicks },
    { key: 'band', label: '낙찰가 대비 저렴한 순', items: byBenchmark },
    { key: 'popular', label: '공공기관 주문 많은 순', items: popular },
  ].filter(tab => tab.items.length > 0)

  const [active, setActive] = useState(tabs[0]?.key ?? 'md')
  const current = tabs.find(tab => tab.key === active) ?? tabs[0]

  if (!current) return null

  return (
    <section id="md" className="scroll-mt-28">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-text text-xl font-semibold">MD 큐레이션</h2>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="큐레이션 정렬">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === current.key}
              onClick={() => setActive(tab.key)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                tab.key === current.key
                  ? 'border-text bg-text text-white font-semibold'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {current.items.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <p className="text-muted mt-5 text-right text-xs">
        <Link href="/shop/products" className="text-primary font-semibold hover:underline">
          전체 상품 보기
        </Link>
      </p>
    </section>
  )
}
