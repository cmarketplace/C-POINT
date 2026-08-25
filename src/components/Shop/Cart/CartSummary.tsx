'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { Product } from '@/components/Shop/product.data'
import { calculateCartAmounts } from '@/lib/cart-amounts'
import type { OrderShipTo } from '@/lib/order-types'
import {
  LoginRequiredError,
  getShipToServerSnapshot,
  getShipToSnapshot,
  newOrderKey,
  placeOrder,
  setShipTo,
  subscribeShipTo,
  toOrderLine,
} from '@/lib/place-order'

interface CartSummaryProps {
  /** 체크된 항목만 집계하고 전송한다. 장바구니 전체가 아니다. */
  selectedItems: { product: Product; quantity: number }[]
}

/**
 * 장바구니 → **후불 주문**.
 *
 * 이 몰은 주문 시점에 돈이 오가지 않는다 — 공급사는 저장 단가 최저 조합으로
 * 자동매칭되고, 결제(현금/카드)는 **배송이 다 끝난 뒤**다. 그래서 이 화면이 분명히
 * 해야 하는 것도 그 한 가지다: 지금 내는 돈이 없고, 이 금액이 나중에 청구된다는 것.
 *
 * 배송지는 주문자가 직접 적는다 — 모두 개방 몰이라 고정 사업장 목록이 없다.
 * 마지막 배송지를 기억해(localStorage) 두 번째 주문부터는 확인만 하면 된다.
 *
 * 금액은 `cart-amounts.ts` 만 쓴다(부가세 포함 총액 = 청구 예정액). 표시가는
 * 예정가가 아니라 **확정가**다 — 표시가가 곧 청구액이다.
 */
export default function CartSummary({ selectedItems }: CartSummaryProps) {
  const router = useRouter()

  // 마지막 배송지 — 외부 스토어(place-order.ts). 입력이 곧 저장이라 «기억» 버튼이 없다.
  const shipTo = useSyncExternalStore(subscribeShipTo, getShipToSnapshot, getShipToServerSnapshot)
  const [isPlacing, setIsPlacing] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)

  /**
   * 재시도 키 — 실패해서 다시 누를 때 **같은 키**를 보내야 주문이 한 건만 생긴다.
   * 성공하면 비워, 다음 장바구니는 새 키를 받는다.
   */
  const orderKeyRef = useRef<string | null>(null)

  const selectedCount = selectedItems.reduce((count, item) => count + item.quantity, 0)
  const amounts = calculateCartAmounts(selectedItems)
  const hasSelection = selectedItems.length > 0

  const setField = (field: keyof OrderShipTo) => (value: string) =>
    setShipTo({ ...shipTo, [field]: field === 'tel' ? value || null : value })

  const handleOrder = async () => {
    if (!hasSelection || isPlacing) return

    setOrderError(null)
    setNeedsLogin(false)
    setIsPlacing(true)

    orderKeyRef.current ??= newOrderKey()

    try {
      const order = await placeOrder({
        shipTo,
        items: selectedItems.map(toOrderLine),
        clientOrderKey: orderKeyRef.current,
      })

      orderKeyRef.current = null
      router.push(`/shop/order-complete?orderNo=${encodeURIComponent(order.orderNo)}`)
    } catch (error) {
      // 로딩을 여기서만 내린다. 성공 경로는 화면이 통째로 바뀌므로 내리지 않는다 —
      // 내리면 이동 직전에 버튼이 잠깐 되살아나 두 번 눌린다.
      setIsPlacing(false)
      if (error instanceof LoginRequiredError) {
        setNeedsLogin(true)
        return
      }
      setOrderError(error instanceof Error ? error.message : '주문을 등록하지 못했습니다.')
    }
  }

  const inputClass =
    'text-text placeholder:text-muted w-full rounded-xl bg-bg px-3 py-2.5 text-sm ' +
    'focus-visible:outline-primary focus-visible:outline-2'

  return (
    <aside className="rounded-2xl bg-light-soft p-6">
      <div className="space-y-4 rounded-xl bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">선택 상품</span>
          <span className="text-text font-medium">
            {selectedItems.length}종 / {selectedCount}개
          </span>
        </div>

        {selectedItems.length > 0 && (
          <div className="border-y border-dashed border-bg py-1">
            <p className="py-2 text-sm font-semibold text-primary">상품별 금액</p>

            <ol className="divide-y divide-dashed divide-bg">
              {selectedItems.map(({ product, quantity }, index) => {
                const itemTotal = product.basePrice * quantity

                return (
                  <li
                    key={product.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">
                        <span className="mr-1.5 text-muted">{index + 1}.</span>
                        {product.name}
                      </p>
                      <p className="mt-1 text-muted">
                        {product.basePrice.toLocaleString()}원 × {quantity}개
                      </p>
                    </div>
                    <strong className="self-end font-semibold text-text">
                      {itemTotal.toLocaleString()}원
                    </strong>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">상품 금액</span>
          <span className="text-text font-medium">{amounts.supply.toLocaleString()}원</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">부가세</span>
          <span className="text-text font-medium">{amounts.vat.toLocaleString()}원</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">배송비</span>
          <span className="text-text font-medium">무료</span>
        </div>
      </div>

      {/* 배송지 — 모두 개방 몰이라 주문자가 직접 적는다. 마지막 값이 미리 채워진다. */}
      <div className="mt-4 space-y-2.5 rounded-xl bg-white p-4">
        <span className="text-muted block text-sm">배송지</span>

        <input
          value={shipTo.name}
          onChange={event => setField('name')(event.target.value)}
          placeholder="받는 곳 (기관·부서명)"
          autoComplete="organization"
          className={inputClass}
        />
        <div className="flex gap-2.5">
          <input
            value={shipTo.zip}
            onChange={event => setField('zip')(event.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="우편번호 5자리"
            inputMode="numeric"
            autoComplete="postal-code"
            className={`${inputClass} w-36`}
          />
          <input
            value={shipTo.tel ?? ''}
            onChange={event => setField('tel')(event.target.value)}
            placeholder="연락처 (선택)"
            inputMode="tel"
            autoComplete="tel"
            className={inputClass}
          />
        </div>
        <input
          value={shipTo.address}
          onChange={event => setField('address')(event.target.value)}
          placeholder="주소"
          autoComplete="street-address"
          className={inputClass}
        />
      </div>

      <div className="mt-6 flex items-end justify-between">
        <span className="text-text font-semibold">청구 예정 금액</span>

        <strong className="text-primary text-2xl font-semibold">
          {amounts.total.toLocaleString()}원
        </strong>
      </div>

      {/* 후불의 핵심 안내 — 「지금 결제창이 안 뜨는 게 정상」임을 여기서 못박는다 */}
      <p className="text-muted mt-1 text-right text-xs leading-5">
        부가세 포함 · <strong className="font-semibold">지금 결제하지 않습니다</strong> —
        배송완료 후 현금/카드로 결제합니다
      </p>

      {needsLogin && (
        <p className="mt-4 rounded-xl bg-highlight-soft px-4 py-3 text-sm leading-6 text-highlight-strong">
          주문하려면 씨마켓 계정으로 로그인해 주세요.{' '}
          <Link href="/login?next=/shop/cart" className="font-semibold underline underline-offset-2">
            로그인하러 가기
          </Link>
        </p>
      )}

      {orderError && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-[#FDECEC] px-4 py-3 text-sm leading-5 text-[#B3261E]"
        >
          {orderError}
        </p>
      )}

      <button
        type="button"
        onClick={handleOrder}
        disabled={!hasSelection || isPlacing}
        className="bg-primary hover:bg-primary-dark mt-6 w-full cursor-pointer rounded-full px-6 py-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {!hasSelection
          ? '주문할 상품을 선택하세요'
          : isPlacing
            ? '주문을 접수하는 중…'
            : '후불로 주문하기'}
      </button>
    </aside>
  )
}
