'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'

import ShopNav from '@/components/Shop/ShopNav'
import { useCartCombination } from '@/components/Shop/Cart/useCartCombination'
import { TENANT } from '@/config/tenant'
import { calculateCartAmounts } from '@/lib/cart-amounts'
import {
  ORDER_ROUTE_LABEL,
  PAYMENT_METHOD_LABEL,
  routeSummary,
  type OrderRoute,
  type OrderShipTo,
  type PaymentMethod,
} from '@/lib/order-types'
import {
  LoginRequiredError,
  getActiveQuoteServerSnapshot,
  getActiveQuoteSnapshot,
  getShipToServerSnapshot,
  getShipToSnapshot,
  newOrderKey,
  placeOrder,
  setActiveQuote,
  setShipTo,
  subscribeActiveQuote,
  subscribeShipTo,
  toOrderLine,
} from '@/lib/place-order'
import { isQuoteValid } from '@/lib/quote-types'

interface CheckoutViewProps {
  /** 로그인한 담당자 이름. 없으면 주문 버튼이 로그인 문으로 안내한다. */
  viewerName: string | null
  /** 제한 고객(공급사) — 안전결제만 보여 준다. 서버도 같은 판정을 다시 한다. */
  restricted: boolean
}

const won = (n: number) => n.toLocaleString('ko-KR')
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(
    new Date(iso),
  )

/**
 * 주문 방법 선택 — 씨마켓 안전결제 / 공급사 직접 구매.
 *
 * 두 경로는 같은 장바구니·같은 조합 위에 선다(`useCartCombination`). 다른 것은 «누구와
 * 계약하고, 계산서가 몇 장이고, 문제 생기면 누구에게 말하나» 다. 그 차이를 카드 두 장과
 * 비교표 하나로 보여 준다 — 가격 차이는 아직 정책이 정해지지 않아 같은 값으로 두고
 * «정책 결정 필요» 표시를 단다.
 *
 * 결제 수단은 안전결제에만 있다. 직접 구매를 고르면 카드 결제창이 사라지고 공급사별
 * 계좌 후불로 안내된다 — 카드가 필요한 기관은 자연히 안전결제로 온다.
 */
export default function CheckoutView({ viewerName, restricted }: CheckoutViewProps) {
  const router = useRouter()
  const { cartItems, result } = useCartCombination()
  const shipTo = useSyncExternalStore(subscribeShipTo, getShipToSnapshot, getShipToServerSnapshot)
  const activeQuote = useSyncExternalStore(
    subscribeActiveQuote,
    getActiveQuoteSnapshot,
    getActiveQuoteServerSnapshot,
  )

  const [route, setRoute] = useState<OrderRoute>('SAFE')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TAX_INVOICE')
  const [isPlacing, setIsPlacing] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const orderKeyRef = useRef<string | null>(null)

  const lines = result.lines
  const n = result.supplierCount
  const amounts = calculateCartAmounts(
    lines.map(line => ({ unitPrice: line.unitPrice, quantity: line.quantity })),
    { shipping: result.shipping },
  )

  // 직접 구매가 막히는 이유 — 안전결제 전용 업체가 섞였거나, 업체 실명이 없거나(비로그인·미제공).
  const directBlockers = lines.filter(
    line => !line.offer.directPurchase || !line.offer.supplierId,
  )
  const directAvailable = !restricted && lines.length > 0 && directBlockers.length === 0
  const effectiveRoute: OrderRoute = route === 'DIRECT' && !directAvailable ? 'SAFE' : route
  const summary = routeSummary(effectiveRoute, n)
  const quoteUsable = activeQuote ? isQuoteValid(activeQuote) : false

  const setField = (field: keyof OrderShipTo) => (value: string) =>
    setShipTo({ ...shipTo, [field]: field === 'tel' ? value || null : value })

  const handleOrder = async () => {
    if (lines.length === 0 || isPlacing) return
    setOrderError(null)
    setNeedsLogin(false)
    setIsPlacing(true)
    orderKeyRef.current ??= newOrderKey()

    try {
      const order = await placeOrder({
        shipTo,
        items: lines.map(toOrderLine),
        clientOrderKey: orderKeyRef.current,
        route: effectiveRoute,
        paymentMethod: effectiveRoute === 'SAFE' ? paymentMethod : null,
        quoteNo: quoteUsable && activeQuote ? activeQuote.quoteNo : null,
        shipping: result.shipping,
      })
      orderKeyRef.current = null
      setActiveQuote(null)
      router.push(`/shop/order-complete?orderNo=${encodeURIComponent(order.orderNo)}`)
    } catch (error) {
      setIsPlacing(false)
      if (error instanceof LoginRequiredError) {
        setNeedsLogin(true)
        return
      }
      setOrderError(error instanceof Error ? error.message : '주문을 등록하지 못했습니다.')
    }
  }

  const inputClass =
    'text-text placeholder:text-muted w-full rounded-xl bg-bg px-3 py-2.5 text-sm focus-visible:outline-primary focus-visible:outline-2'

  if (cartItems.length === 0 || lines.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <ShopNav showBack />
        <div className="container-shop py-16 text-center">
          <h1 className="text-text text-xl font-semibold">주문할 상품이 없습니다</h1>
          <p className="text-muted mt-2 text-sm">장바구니에서 주문할 품목을 선택해 주세요.</p>
          <Link
            href="/shop/cart"
            className="bg-primary hover:bg-primary-dark mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            장바구니로
          </Link>
        </div>
      </main>
    )
  }

  const routeCards: { key: OrderRoute; title: string; who: string; steps: string[] }[] = [
    {
      key: 'SAFE',
      title: ORDER_ROUTE_LABEL.SAFE,
      who: `${TENANT.orgName}이 대금을 받아 공급사에 정산합니다. 담당자는 ${TENANT.orgName} 한 곳만 상대합니다.`,
      steps: ['발주', '공급사 납품', '검수', `${TENANT.orgName}에 결제`, `${TENANT.orgName} → 공급사 정산`],
    },
    {
      key: 'DIRECT',
      title: ORDER_ROUTE_LABEL.DIRECT,
      who: '공급사와 직접 계약합니다. 기존 거래처와 이어서 거래할 때 알맞습니다.',
      steps: ['발주', '공급사 납품', '검수', '공급사별 결제'],
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <ShopNav showBack />

      <div className="container-shop py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-text text-xl font-semibold tracking-[-0.03rem]">주문 방법 선택</h1>
          {activeQuote && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                quoteUsable ? 'bg-highlight-soft text-highlight-strong' : 'bg-bg text-muted'
              }`}
            >
              <FileText size={13} />
              견적서 {activeQuote.quoteNo}
              {quoteUsable ? ` · ${formatDate(activeQuote.validUntil)}까지 잠금` : ' · 만료'}
            </span>
          )}
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {restricted && (
              <p className="bg-blue-tint-2 text-primary mb-4 rounded-xl px-4 py-2.5 text-xs font-semibold">
                공급사 계정은 씨마켓 안전결제로만 주문할 수 있습니다. 계약·계산서 상대는 씨마켓입니다.
              </p>
            )}

            {/* ── 경로 카드 ── */}
            <div className="grid gap-4 md:grid-cols-2" role="radiogroup" aria-label="주문 방법">
              {routeCards.filter(card => !restricted || card.key === 'SAFE').map(card => {
                const active = effectiveRoute === card.key
                const disabled = card.key === 'DIRECT' && !directAvailable
                const detail = routeSummary(card.key, n)
                return (
                  <button
                    key={card.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={disabled}
                    onClick={() => setRoute(card.key)}
                    className={`flex cursor-pointer flex-col gap-3 rounded-2xl border p-5 text-left transition-colors disabled:cursor-not-allowed ${
                      active ? 'border-primary bg-blue-tint' : 'border-border bg-white hover:bg-light-soft'
                    } ${disabled ? 'opacity-60' : ''}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
                          active ? 'border-primary' : 'border-border'
                        }`}
                      >
                        {active && <span className="bg-primary h-2 w-2 rounded-full" />}
                      </span>
                      <span className="text-text text-base font-semibold">{card.title}</span>
                    </span>
                    <span className="text-muted text-xs leading-5">{card.who}</span>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      {[
                        ['계약 상대', detail.counterpart],
                        ['세금계산서', detail.invoice],
                        ['결제', detail.payment],
                        ['배송', detail.shipping],
                        ['문제 생기면', detail.support],
                      ].map(([label, value]) => (
                        <div key={label} className="contents">
                          <dt className="text-muted">{label}</dt>
                          <dd className="text-text">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <span className="text-muted flex flex-wrap items-center gap-1 text-[11px]">
                      {card.steps.map((step, index) => (
                        <span key={step} className="contents">
                          {index > 0 && <span aria-hidden="true">→</span>}
                          <span className="bg-white rounded-md px-1.5 py-0.5">{step}</span>
                        </span>
                      ))}
                    </span>
                    {disabled && (
                      <span className="text-[#B3261E] text-[11px] leading-4">
                        {directBlockers.some(line => !line.offer.supplierId)
                          ? '공급사 실명이 없는 품목이 있어 직접 계약할 수 없습니다. 로그인하면 실명이 보입니다.'
                          : `안전결제 전용 업체가 ${directBlockers.length}품목에 있습니다. 장바구니에서 업체를 바꾸면 열립니다.`}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* ── 비교표 (발주기관만 — 제한 고객에겐 비교할 다른 경로가 없다) ── */}
            {!restricted && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-muted text-left text-xs">
                    <th className="w-32 py-2 font-medium" />
                    <th className="py-2 font-medium">{ORDER_ROUTE_LABEL.SAFE}</th>
                    <th className="py-2 font-medium">{ORDER_ROUTE_LABEL.DIRECT}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg">
                  {[
                    [
                      '상품·배송 합계',
                      `${won(amounts.supply + amounts.shipping)}원`,
                      `${won(amounts.supply + amounts.shipping)}원`,
                      true,
                    ],
                    ['계약 상대', `${TENANT.orgName} 1곳`, `공급사 ${n}곳`],
                    ['세금계산서', '1장', `${n}장`],
                    ['결제 횟수', '1회', `${n}회`],
                    ['카드 결제', '가능', '공급사별 상이'],
                    ['교환·반품 창구', TENANT.orgName, '각 공급사'],
                  ].map(([label, safe, direct, policy]) => (
                    <tr key={label as string}>
                      <td className="text-muted py-2.5 pr-3">{label}</td>
                      <td className={`py-2.5 pr-3 ${effectiveRoute === 'SAFE' ? 'text-text font-semibold' : 'text-muted'}`}>
                        {safe}
                      </td>
                      <td className={`py-2.5 ${effectiveRoute === 'DIRECT' ? 'text-text font-semibold' : 'text-muted'}`}>
                        {direct}
                        {policy && (
                          <span className="bg-bg text-muted ml-2 rounded-full px-2 py-0.5 text-[11px]">
                            경로별 가격 정책 결정 필요
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            {/* ── 결제 수단 (안전결제만) ── */}
            {effectiveRoute === 'SAFE' && (
              <div className="mt-6 rounded-2xl bg-light-soft p-5">
                <p className="text-text text-sm font-semibold">결제 수단</p>
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="결제 수단">
                  {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === method}
                      onClick={() => setPaymentMethod(method)}
                      className={`cursor-pointer rounded-control border px-4 py-2.5 text-sm transition-colors ${
                        paymentMethod === method
                          ? 'border-primary bg-blue-tint-2 text-primary font-semibold'
                          : 'border-border bg-white text-text hover:bg-bg'
                      }`}
                    >
                      {PAYMENT_METHOD_LABEL[method]}
                      {method === 'TAX_INVOICE' && <span className="text-muted ml-1 text-xs">· 납품 후 30일</span>}
                    </button>
                  ))}
                </div>
                {!restricted && (
                  <p className="text-muted mt-3 text-xs leading-5">
                    직접 구매를 고르면 카드 결제창은 사라지고 공급사 {n}곳의 계좌가 안내됩니다.
                  </p>
                )}
              </div>
            )}
            {effectiveRoute === 'DIRECT' && (
              <div className="mt-6 rounded-2xl bg-light-soft p-5">
                <p className="text-text text-sm font-semibold">결제</p>
                <p className="text-muted mt-2 text-xs leading-5">
                  납품 검수 후 공급사 {n}곳이 각각 세금계산서를 발행하고, 계좌로 후불 결제합니다.
                  카드 결제는 공급사별로 다릅니다.
                </p>
              </div>
            )}

            {/* ── 배송지 ── */}
            <div className="mt-6 rounded-2xl bg-light-soft p-5">
              <p className="text-text text-sm font-semibold">배송지</p>
              <p className="text-muted mt-1 text-xs">마지막에 적은 주소가 미리 채워집니다.</p>
              <div className="mt-3 space-y-2.5">
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
            </div>
          </div>

          {/* ── 요약 ── */}
          <aside className="rounded-2xl bg-light-soft p-6 lg:sticky lg:top-24">
            <p className="text-primary text-xs font-semibold">{ORDER_ROUTE_LABEL[effectiveRoute]} 주문</p>
            {viewerName && <p className="text-muted mt-1 text-xs">주문자 {viewerName}</p>}

            <ol className="divide-bg mt-4 divide-y divide-dashed rounded-xl bg-white px-4">
              {lines.map(line => (
                <li key={line.product.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="text-text truncate font-medium">{line.product.name}</p>
                    <p className="text-muted mt-0.5 truncate">
                      {line.offer.supplierName ? `${line.offer.supplierName} · ` : ''}
                      {won(line.unitPrice)}원 × {line.quantity}
                    </p>
                  </div>
                  <strong className="text-text self-end font-semibold tabular-nums">{won(line.lineTotal)}원</strong>
                </li>
              ))}
            </ol>

            <dl className="mt-4 space-y-2 text-sm">
              {[
                ['상품 금액', `${won(amounts.supply)}원`],
                ['배송비', amounts.shipping > 0 ? `${won(amounts.shipping)}원` : '무료'],
                ['부가세', `${won(amounts.vat)}원`],
                ['받는 곳', effectiveRoute === 'SAFE' ? TENANT.safePaymentCounterpart : result.groups.map(group => group.label).join(', ')],
                ['계산서', summary.invoice],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="text-muted shrink-0">{label}</dt>
                  <dd className="text-text text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="border-bg mt-4 flex items-end justify-between border-t border-dashed pt-4">
              <span className="text-text font-semibold">결제 예정</span>
              <strong className="text-primary text-2xl font-semibold tabular-nums">{won(amounts.total)}원</strong>
            </div>

            {needsLogin && (
              <p className="mt-4 rounded-xl bg-highlight-soft px-4 py-3 text-sm leading-6 text-highlight-strong">
                주문하려면 씨마켓 계정으로 로그인해 주세요.{' '}
                <Link href="/login?next=/shop/checkout" className="font-semibold underline underline-offset-2">
                  로그인하러 가기
                </Link>
              </p>
            )}
            {orderError && (
              <p role="alert" className="mt-4 rounded-xl bg-[#FDECEC] px-4 py-3 text-sm leading-5 text-[#B3261E]">
                {orderError}
              </p>
            )}

            <button
              type="button"
              onClick={handleOrder}
              disabled={isPlacing}
              className="bg-primary hover:bg-primary-dark mt-5 w-full cursor-pointer rounded-full px-6 py-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isPlacing
                ? '주문을 접수하는 중…'
                : effectiveRoute === 'SAFE'
                  ? '안전결제로 주문 확정'
                  : `공급사 ${n}곳에 발주 확정`}
            </button>
            <Link
              href="/shop/cart"
              className="text-muted-strong hover:bg-bg mt-2 block w-full rounded-full px-6 py-3 text-center text-sm font-semibold transition-colors"
            >
              장바구니로
            </Link>
            <p className="text-muted mt-3 text-xs leading-5">
              후불이므로 지금 결제되지 않습니다. 납품 검수 후 청구서가 발행됩니다.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
