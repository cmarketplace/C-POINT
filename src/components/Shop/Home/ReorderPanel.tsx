import Link from 'next/link'

import BudgetWidget from '@/components/Shop/Home/BudgetWidget'
import type { StorefrontOrder } from '@/lib/order-types'

interface ReorderPanelProps {
  /** 로그인한 담당자 이름. 없으면 이 판은 «로그인하면 보입니다» 한 줄이다. */
  viewerName: string | null
  orders: StorefrontOrder[]
  /** KST 이번 달 'YYYY-MM'. 서버가 넘긴다. */
  month: string
}

interface RepeatRow {
  itemId: string
  name: string
  count: number
  /** 평균 주문 간격(일). 두 번 이상 샀을 때만. */
  intervalDays: number | null
  lastQuantity: number
}

const won = (n: number) => n.toLocaleString('ko-KR')

/** 취소되지 않은 주문에서 두 번 이상 산 품목을 찾는다. */
function detectRepeats(orders: StorefrontOrder[]): RepeatRow[] {
  const byItem = new Map<string, { name: string; dates: number[]; lastQuantity: number }>()
  for (const order of orders) {
    if (order.status === 'CANCELED') continue
    const at = new Date(order.createdAt).getTime()
    for (const item of order.items) {
      const entry = byItem.get(item.itemId) ?? { name: item.name, dates: [], lastQuantity: item.quantity }
      entry.dates.push(at)
      if (at >= Math.max(...entry.dates)) entry.lastQuantity = item.quantity
      byItem.set(item.itemId, entry)
    }
  }
  return [...byItem.entries()]
    .filter(([, entry]) => entry.dates.length >= 2)
    .map(([itemId, entry]) => {
      const sorted = [...entry.dates].sort((a, b) => a - b)
      const span = sorted[sorted.length - 1] - sorted[0]
      return {
        itemId,
        name: entry.name,
        count: sorted.length,
        intervalDays: sorted.length > 1 ? Math.round(span / (sorted.length - 1) / 86_400_000) : null,
        lastQuantity: entry.lastQuantity,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

/**
 * 우리 기관 재주문 — 반복 주문 감지 + 부서 예산.
 *
 * 지난 주문에서 «같은 걸 또 샀다» 를 찾아 구독 전환을 제안한다. 예산 칸은 이번 달 주문
 * 합계를 담당자가 적어 둔 월 예산과 견준다(예산은 브라우저에만 저장 — `BudgetWidget`).
 */
export default function ReorderPanel({ viewerName, orders, month }: ReorderPanelProps) {
  if (!viewerName) {
    return (
      <section className="rounded-2xl bg-light-soft px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-text text-base font-semibold">우리 기관 재주문</h2>
            <p className="text-muted mt-1 text-sm">
              로그인하면 반복 주문 품목과 이번 달 예산 사용 현황이 여기 보입니다.
            </p>
          </div>
          <Link
            href="/login?next=/shop"
            className="bg-primary hover:bg-primary-dark rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            씨마켓 계정으로 로그인
          </Link>
        </div>
      </section>
    )
  }

  const repeats = detectRepeats(orders)
  const monthSpend = orders
    .filter(order => order.status !== 'CANCELED' && order.createdAt.startsWith(month))
    .reduce((sum, order) => sum + order.totalPayable, 0)
  const monthOrders = orders.filter(order => order.createdAt.startsWith(month)).length

  return (
    <section id="reorder" className="scroll-mt-28">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-text text-xl font-semibold">우리 기관 재주문</h2>
        <Link href="/shop/orders" className="text-primary text-xs font-semibold hover:underline">
          지난 주문 {orders.length}건 보기
        </Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <p className="text-muted text-xs font-semibold">반복 주문 감지</p>
          {repeats.length === 0 ? (
            <p className="text-muted mt-3 text-sm leading-6">
              아직 두 번 이상 주문한 품목이 없습니다. 같은 품목을 다시 사면 여기서 구독 전환을 제안합니다.
            </p>
          ) : (
            <ul className="divide-bg mt-2 divide-y">
              {repeats.map(row => (
                <li key={row.itemId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="text-text truncate font-medium">{row.name}</p>
                    <p className="text-muted text-xs">
                      {row.count}회 주문
                      {row.intervalDays ? ` · 약 ${row.intervalDays}일마다` : ''} · 마지막 {row.lastQuantity}개
                    </p>
                  </div>
                  <Link
                    href="#subscribe"
                    className="text-primary hover:bg-blue-tint-2 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    구독으로 전환
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <BudgetWidget month={month} spend={monthSpend} orderCount={monthOrders} />
      </div>
      <p className="text-muted mt-2 text-[11px]">
        이번 달 사용 {won(monthSpend)}원은 취소되지 않은 주문의 청구 예정 금액 합계입니다.
      </p>
    </section>
  )
}
