import Link from 'next/link'

import ProductCard from '@/components/Shop/ProductCard'
import { daysUntil, ddayLabel, type SeasonEvent } from '@/config/seasons'
import type { SeasonSection } from '@/lib/catalog'

interface SeasonStripProps {
  featured: SeasonSection | null
  others: SeasonEvent[]
  /** KST 오늘. 서버에서 한 번 계산해 넘긴다 — 클라이언트에서 다시 세면 자정 근처에 어긋난다. */
  today: string
}

/**
 * 시즌 — 할인 배너가 아니라 **배송 마감 카운트다운**.
 *
 * 왼쪽 판은 D-day 와 마감, 오른쪽은 그 시즌 상품 세 장. 다른 시즌은 칩으로만 둔다.
 * 판은 navy 한 색이다 — 디자인 시스템의 «파랑·시안·민트·회색만» 안에서 가장 진한 면.
 */
export default function SeasonStrip({ featured, others, today }: SeasonStripProps) {
  if (!featured && others.length === 0) return null

  return (
    <section id="season" className="scroll-mt-28">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {featured ? (
          <div className="bg-navy flex flex-col rounded-3xl p-6 text-white">
            <span className="text-on-dark-muted text-xs font-semibold tracking-wide">시즌</span>
            <p className="mt-3 text-[40px] leading-none font-semibold tabular-nums">
              {featured.event.title} {ddayLabel(daysUntil(featured.event.date, today))}
            </p>
            {featured.event.deadline && (
              <p className="mt-4 text-sm leading-6">
                연휴 전 마지막 배송 마감은 <strong className="font-semibold">{featured.event.deadline}</strong>입니다.
              </p>
            )}
            <p className="text-on-dark-muted mt-2 text-sm leading-6">{featured.event.description}</p>
            {others.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {others.map(season => (
                  <span
                    key={season.key}
                    className="rounded-full border border-white/30 px-2.5 py-1 text-[11px] text-white"
                  >
                    {season.title} {ddayLabel(daysUntil(season.date, today))}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-tint rounded-3xl p-6">
            <span className="text-primary text-xs font-semibold tracking-wide">다가오는 시즌</span>
            <ul className="mt-3 space-y-2">
              {others.map(season => (
                <li key={season.key} className="text-text text-sm">
                  <strong className="font-semibold">{season.title}</strong>{' '}
                  <span className="text-muted">{ddayLabel(daysUntil(season.date, today))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {featured && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {featured.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      {featured && (
        <p className="text-muted mt-3 text-right text-xs">
          <Link
            href={`/shop/products?q=${encodeURIComponent(featured.event.keywords[0])}`}
            className="text-primary font-semibold hover:underline"
          >
            {featured.event.title} 상품 더 보기
          </Link>
        </p>
      )}
    </section>
  )
}
