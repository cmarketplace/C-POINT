'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

import { useShop } from '@/app/providers/ShopProvider'
import {
  ORDER_STATUS_HINT,
  ORDER_STATUS_LABEL,
  type StorefrontOrder,
} from '@/lib/order-types'
import ShopNav from '../ShopNav'

interface OrderCompleteProps {
  /** 서버에서 포맷해 내려준 주문 일시. 클라이언트에서 만들면 하이드레이션이 깨진다. */
  orderedAt: string
  /**
   * 서버가 확정한 주문 — **영수증의 정본**.
   *
   * 장바구니 화면 값을 다시 그리지 않는다. 세모 연동 후에는 단가가 카탈로그에서
   * 재확정되어 화면과 다를 수 있고, 그때 화면 값을 보여 주면 실제 청구액과 다른
   * 종이가 나간다. 새로고침해도 남는 것도 이 경로뿐이다.
   */
  order: StorefrontOrder | null
}

export default function OrderComplete({ orderedAt, order }: OrderCompleteProps) {
  const { removeFromCart } = useShop()

  // 주문으로 나간 품목만 장바구니에서 뺀다. 통째로 비우면 선택하지 않았던
  // (다음에 사려던) 줄까지 사라진다.
  useEffect(() => {
    if (!order) return
    for (const item of order.items) removeFromCart(item.itemId)
    // removeFromCart 는 외부 스토어라 참조가 바뀌지 않는다 — 주문번호 기준 1회면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderNo])

  if (!order) {
    return (
      <main className="bg-white">
        <ShopNav showBack />
        <div className="container-shop py-10 lg:py-14">
          <div className="mx-auto w-full max-w-xl">
            <h1 className="text-text text-2xl font-semibold">주문을 찾을 수 없습니다</h1>
            <p className="text-muted mt-2 text-sm leading-6">
              주소가 잘못되었거나 다른 계정의 주문입니다. 주문 내역에서 다시 확인해 주세요.
            </p>
            <Link
              href="/shop/orders"
              className="bg-primary hover:bg-primary-dark mt-6 inline-block rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-colors"
            >
              주문 내역 보기
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const statusLabel = ORDER_STATUS_LABEL[order.status]
  const statusHint = ORDER_STATUS_HINT[order.status]

  return (
    <main className="bg-white">
      <ShopNav showBack />

      <div className="container-shop py-10 lg:py-14">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-3">
            <span className="bg-primary flex h-10 w-10 items-center justify-center rounded-full text-white">
              <Check size={22} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-text text-2xl font-semibold">주문이 접수되었습니다</h1>
              <p className="text-muted mt-0.5 text-sm">{orderedAt}</p>
            </div>
          </div>

          {/* 주문번호·상태 — 문의할 때 담당자가 부르는 값이라 복사하기 좋게 크게 둔다 */}
          <div className="bg-light-soft mt-6 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-muted text-xs font-medium">주문번호</p>
                <p className="text-text mt-0.5 font-mono text-lg font-semibold">{order.orderNo}</p>
              </div>
              <span className="bg-highlight-soft text-highlight-strong rounded-full px-3 py-1 text-sm font-semibold">
                {statusLabel}
              </span>
            </div>
            {statusHint && <p className="text-muted mt-3 text-sm leading-6">{statusHint}</p>}
          </div>

          {/* 품목 — 서버가 확정한 줄이다 */}
          <div className="mt-6 rounded-2xl bg-white">
            <h2 className="text-text text-base font-semibold">주문 품목</h2>
            <ol className="divide-bg mt-2 divide-y divide-dashed">
              {order.items.map(item => (
                <li
                  key={item.seq}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-text truncate font-medium">{item.name}</p>
                    <p className="text-muted mt-0.5">
                      {[item.spec, item.unit].filter(Boolean).join(' · ')}
                      {item.spec || item.unit ? ' · ' : ''}
                      {item.unitPrice.toLocaleString()}원 × {item.quantity}개
                    </p>
                  </div>
                  <strong className="text-text self-end font-semibold">
                    {(item.unitPrice * item.quantity).toLocaleString()}원
                  </strong>
                </li>
              ))}
            </ol>
          </div>

          {/* 금액 — 후불이라 «낸 돈» 이 아니라 «청구 예정» 이다. 그 구분이 흐려지면
            * 손님은 결제가 됐다고 읽거나, 반대로 이중청구를 걱정한다. */}
          <div className="bg-light-soft mt-6 space-y-2.5 rounded-2xl p-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">상품 금액</span>
              <span className="text-text font-medium">{order.totalSupply.toLocaleString()}원</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">부가세</span>
              <span className="text-text font-medium">{order.totalVat.toLocaleString()}원</span>
            </div>
            <div className="border-bg flex items-center justify-between border-t border-dashed pt-2.5">
              <span className="text-text font-semibold">청구 예정 금액</span>
              <strong className="text-primary text-lg font-semibold">
                {order.totalPayable.toLocaleString()}원
              </strong>
            </div>
            <p className="text-muted text-xs leading-5">
              지금 결제된 금액은 없습니다. 배송이 모두 끝나면 현금/카드 결제 안내가 이어지고,
              세금계산서는 결제 후 이메일로 발송됩니다.
            </p>
          </div>

          {/* 배송지 — 주문에 박힌 값이다. 나중에 다시 열어도 그때 그 주소가 나온다 */}
          <div className="mt-6 rounded-2xl bg-white">
            <h2 className="text-text text-base font-semibold">배송 정보</h2>
            <p className="text-text mt-2 text-sm font-medium">{order.shipToName}</p>
            <p className="text-muted mt-1 text-sm leading-6">
              ({order.shipToZip}) {order.shipToAddress}
              {order.shipToTel && ` · ${order.shipToTel}`}
            </p>
            <p className="text-muted mt-2 text-xs leading-5">
              공급사별로 발송되어 따로 도착할 수 있습니다.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop/orders"
              className="bg-primary hover:bg-primary-dark flex-1 rounded-full px-6 py-3.5 text-center text-sm font-semibold text-white transition-colors"
            >
              주문 내역 보기
            </Link>
            <Link
              href="/shop"
              className="text-muted-strong hover:bg-bg flex-1 rounded-full bg-light-soft px-6 py-3.5 text-center text-sm font-semibold transition-colors"
            >
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
