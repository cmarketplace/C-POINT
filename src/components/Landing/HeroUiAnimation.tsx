'use client'

import { useEffect, useRef, useState } from 'react'
import { Crown, Search, ShoppingCart } from 'lucide-react'

import { FilledCategoryIcon, iconPalettes } from '@/components/Shop/categoryIcons'

/**
 * 히어로 인터랙티브 UI 애니메이션 — 「찾고 → 담고 → 최저가가 자동으로 붙고 → 구매완료」.
 *
 * 장면을 갈아 끼우지 않는다. **장바구니는 처음부터 끝까지 같은 자리에 있고**, 카테고리
 * 타일도 마지막까지 배경에 남는다. 화면이 바뀌면 «다른 시스템으로 넘어갔다»로 읽히는데,
 * 이 몰이 말하려는 것은 장 보는 동작 하나가 끝까지 이어진다는 것이다.
 *
 * 0.1s  타일 여섯 장이 100ms 간격으로 떠오른다(고르지 않는다 — 그냥 놓여 있다)
 * 0.9s  「품명·CAS·규격 검색」 타이핑 → 검색 반응 · 타일이 바깥으로 6px
 * 2.7s  매칭된 타일이 1.04배로 올라오고 + 배지 → 복제본이 곡선을 그리며 장바구니로
 * 4.0s  장바구니에서 승인 단가 셋이 올라와 가로로 정렬된다
 * 5.2s  10,800원만 1.08배로 서고 왕관 · 초록, 나머지는 0.94배로 물러난다
 * 6.0s  승자가 장바구니로 내려앉고 → 카트가 앞으로 나오며 큰 체크 · 구매완료
 *
 * 타이핑 이후 약 6초. 아이콘은 몰 카테고리 레일과 **같은 컴포넌트**(`Shop/categoryIcons`)다.
 */

const SEARCH_TEXT = '품명·CAS·규격 검색'

/** 시작 화면의 카테고리 타일. 글자 없이 색과 모양만으로 «고를 것이 많다»를 말한다. */
const TILES = [
  { variant: 'tag', palette: 1 },
  { variant: 'scissors', palette: 2 },
  { variant: 'box', palette: 3 },
  { variant: 'pen', palette: 4 },
  { variant: 'lab', palette: 5 },
] as const

/** 검색 결과로 걸리는 타일. 여는 장면에서는 이 타일도 그냥 놓여 있을 뿐이다. */
const MATCH_TILE = 2

/** 카트 위에 흩어 놓을 자리. 격자로 세우면 «메뉴»가 되고, 흩어 놓아야 «떠 있는 상품»이 된다. */
const TILE_SPOTS = [
  { left: 6, top: 46, spread: -8 },
  { left: 24, top: 20, spread: -4 },
  { left: 43, top: 34, spread: 0 },
  { left: 62, top: 16, spread: 4 },
  { left: 80, top: 44, spread: 8 },
]

/** 카트에서 올라올 때의 흩어짐 — 정렬되면 전부 0 이 된다. */
const SCATTER = [
  { x: -10, y: 6, r: -3 },
  { x: 4, y: -4, r: 2 },
  { x: 12, y: 5, r: 3 },
]


/** 같은 상품의 승인 단가 셋. 공급처는 드러나지 않고 값만 비교된다. */
const PRICES = ['12,500원', '11,700원', '10,800원'] as const
const LOWEST = PRICES.length - 1

export default function HeroUiAnimation() {
  const [phase, setPhase] = useState<number>(0)
  // phase:
  // 0: 타일 등장 · 1: 타이핑 · 2: 검색 반응 · 3: 매칭 타일 상승
  // 4: 담김 · 5: 단가 셋 · 6: 최저가 선정 · 7: 카트가 앞으로 · 8: 구매완료 · 9: 페이드

  const [opened, setOpened] = useState<boolean>(false)
  const [typedText, setTypedText] = useState<string>('')
  const [cartCount, setCartCount] = useState<number>(0)
  const [priceStage, setPriceStage] = useState<number>(0) // 0 숨김 · 1 흩어짐 · 2 정렬


  const stageRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)
  const basketRef = useRef<HTMLSpanElement>(null)
  const matchRef = useRef<HTMLDivElement>(null)
  const lowestRef = useRef<HTMLDivElement>(null)
  const clonesRef = useRef<HTMLElement[]>([])

  useEffect(() => {
    let cancelled = false
    let winnerAnimation: Animation | null = null
    const timers: ReturnType<typeof setTimeout>[] = []

    /** setInterval 을 여러 개 띄우는 대신, 순서를 그대로 읽히게 await 로 잇는다. */
    const wait = (ms: number) =>
      new Promise<void>(resolve => {
        timers.push(setTimeout(resolve, ms))
      })

    const pulseCart = (scale: number, lift: number) => {
      cartRef.current?.animate(
        [
          { transform: 'translateY(0) scale(1)' },
          { transform: `translateY(${lift}px) scale(${scale})` },
          { transform: 'translateY(0) scale(1)' },
        ],
        { duration: 340, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      )
    }

    /** 타일을 복제해 바구니 «안»으로 날린다. 원본은 자리에 남는다. */
    const flyToCart = (source: HTMLElement | null) => {
      const stage = stageRef.current
      const basket = basketRef.current
      if (!stage || !basket || !source) return

      const stageBox = stage.getBoundingClientRect()
      const from = source.getBoundingClientRect()
      const to = basket.getBoundingClientRect()

      // 무대가 확대돼 있으면 그 안쪽 1px 은 화면의 1.18px 이다. 화면 좌표를 그대로
      // 쓰면 복제본이 어긋나므로 배율로 되돌린다.
      const scale = stage.offsetWidth ? stageBox.width / stage.offsetWidth : 1

      const clone = source.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.left = `${(from.left - stageBox.left) / scale}px`
      clone.style.top = `${(from.top - stageBox.top) / scale}px`
      clone.style.width = `${from.width / scale}px`
      clone.style.height = `${from.height / scale}px`
      clone.style.margin = '0'
      clone.style.animation = 'none'
      clone.style.pointerEvents = 'none'
      clone.style.zIndex = '5'
      stage.appendChild(clone)
      clonesRef.current.push(clone)

      const dx = (to.left + to.width / 2 - (from.left + from.width / 2)) / scale
      const dy = (to.top + to.height / 2 - (from.top + from.height / 2)) / scale

      // 직선으로 가면 «전송»처럼 보인다. 살짝 떠올랐다 내려앉아야 «담는» 동작이 된다.
      const curve = `path('M 0 0 C ${dx * 0.15} -34, ${dx * 0.7} ${dy * 0.35}, ${dx} ${dy}')`
      const canPath = typeof CSS !== 'undefined' && CSS.supports?.('offset-path', curve)

      const animation = canPath
        ? (() => {
            clone.style.offsetPath = curve
            clone.style.offsetRotate = '0deg'
            return clone.animate(
              [
                { offsetDistance: '0%', scale: '1', rotate: '0deg', opacity: 1 },
                { offsetDistance: '88%', scale: '0.78', rotate: '3deg', opacity: 1, offset: 0.88 },
                { offsetDistance: '100%', scale: '0.72', rotate: '3deg', opacity: 0 },
              ],
              { duration: 660, easing: 'cubic-bezier(0.33, 0, 0.2, 1)', fill: 'forwards' }
            )
          })()
        : clone.animate(
            [
              { transform: 'translate(0px, 0px) scale(1) rotate(0deg)', opacity: 1 },
              {
                transform: `translate(${dx * 0.6}px, ${dy * 0.35 - 28}px) scale(0.78) rotate(3deg)`,
                opacity: 1,
                offset: 0.88,
              },
              { transform: `translate(${dx}px, ${dy}px) scale(0.72) rotate(3deg)`, opacity: 0 },
            ],
            { duration: 660, easing: 'cubic-bezier(0.33, 0, 0.2, 1)', fill: 'forwards' }
          )

      animation.onfinish = () => {
        clone.remove()
        clonesRef.current = clonesRef.current.filter(node => node !== clone)
      }
    }

    /** 승자는 복제하지 않는다 — 그 카드 자체가 장바구니로 내려앉아야 «적용»으로 읽힌다. */
    const dropWinnerIntoCart = () => {
      const card = lowestRef.current
      const basket = basketRef.current
      if (!card || !basket) return

      const stage = stageRef.current
      const scale = stage && stage.offsetWidth
        ? stage.getBoundingClientRect().width / stage.offsetWidth
        : 1
      const from = card.getBoundingClientRect()
      const to = basket.getBoundingClientRect()
      const dy = (to.top + to.height / 2 - (from.top + from.height / 2)) / scale

      // fill: 'forwards' 라 다음 바퀴 전에 반드시 취소해야 한다 — 안 그러면 두 번째
      // 루프에서 승자 카드가 내려간 자리에 그대로 눌러앉는다.
      winnerAnimation = card.animate(
        [
          { transform: 'translateY(-8px) scale(1.08)', opacity: 1 },
          { transform: `translateY(${dy}px) scale(0.75)`, opacity: 0 },
        ],
        { duration: 500, easing: 'cubic-bezier(0.33, 0, 0.2, 1)', fill: 'forwards' }
      )
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const run = async () => {
      await wait(0)
      if (cancelled) return

      // 모션 최소화 설정 — 결과 상태만 세워 두고 끝낸다.
      if (reduced) {
        setOpened(true)
        setTypedText(SEARCH_TEXT)
        setCartCount(1)
        setPhase(8)
        return
      }

      while (!cancelled) {
        winnerAnimation?.cancel()
        winnerAnimation = null
        setPhase(0)
        setOpened(false)
        setTypedText('')
        setCartCount(0)
        setPriceStage(0)

        await wait(120)
        if (cancelled) return
        setOpened(true)

        // 0.9s: 타이핑
        await wait(780)
        if (cancelled) return
        setPhase(1)
        for (let i = 1; i <= SEARCH_TEXT.length; i++) {
          await wait(105)
          if (cancelled) return
          setTypedText(SEARCH_TEXT.slice(0, i))
        }

        // 검색 반응 — 타일이 바깥으로 벌어진다
        await wait(200)
        if (cancelled) return
        setPhase(2)

        // 매칭 타일이 올라오고 + 배지
        await wait(420)
        if (cancelled) return
        setPhase(3)

        // 확대가 자리를 잡을 즈음 복제본이 장바구니로 (한 동작으로 이어진다)
        await wait(560)
        if (cancelled) return
        flyToCart(matchRef.current)

        await wait(660)
        if (cancelled) return
        pulseCart(1.04, 2)
        setCartCount(1)
        setPhase(4)

        // 담긴 «다음에» 카트에서 단가 셋이 올라온다
        await wait(200)
        if (cancelled) return
        setPhase(5)
        setPriceStage(1)

        await wait(420)
        if (cancelled) return
        setPriceStage(2)

        // 최저가 선정
        await wait(520)
        if (cancelled) return
        setPhase(6)

        // 승자가 장바구니로 내려앉는다
        await wait(700)
        if (cancelled) return
        dropWinnerIntoCart()

        await wait(500)
        if (cancelled) return
        pulseCart(1.03, 0)
        setPhase(7)

        // 카트가 앞으로 나온 뒤 큰 체크
        await wait(420)
        if (cancelled) return
        setPhase(8)

        await wait(1300)
        if (cancelled) return
        setPhase(9)

        await wait(500)
        if (cancelled) return
      }
    }

    run()

    return () => {
      cancelled = true
      winnerAnimation?.cancel()
      timers.forEach(t => clearTimeout(t))
      clonesRef.current.forEach(node => node.remove())
      clonesRef.current = []
    }
  }, [])

  return (
    <div className="relative w-full max-w-[560px] mx-auto select-none">

      {/* 메인 화이트 UI 카드 */}
      <div className="relative overflow-hidden rounded-3xl bg-[#f5f2fc] p-6 sm:p-7  transition-all duration-500 min-h-[410px] flex flex-col justify-between">
        
        {/* 상단 브라우저/엔진 헤더 바 & 실시간 장바구니 위젯 (Blue Color) */}
        <div className="flex items-center justify-between   pb-3.5 mb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
          </div>

          {/* 실시간 반응형 장바구니 카운터 */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              cartCount > 0
                ? 'bg-[#f5f2fd] text-[#573ec9]   scale-105 '
                : 'bg-[#F0F5FA] text-[#64748B]'
            }`}
          >
            <ShoppingCart
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                cartCount > 0 ? 'text-[#573ec9] scale-110' : 'text-[#64748B]'
              }`}
            />
            <span className="text-[11px] font-medium">장바구니</span>
            <span
              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full transition-all duration-300 ${
                cartCount > 0
                  ? 'bg-[#573ec9] text-white'
                  : 'bg-[#E2E8F0] text-[#64748B]'
              }`}
            >
              {cartCount}
            </span>
          </div>
        </div>

        {/* 1. 스마트 검색 인풋창 — 검색이 끝나면 조용히 물러난다. 자리는 그대로 두고
          * 투명도만 내린다(레이아웃이 튀지 않게). 비워진 자리는 커지는 무대가 채운다. */}
        <div
          className="relative mb-4 transition-all duration-400 ease-out"
          style={{
            opacity: phase >= 3 ? 0 : 1,
            transform: phase >= 3 ? 'translateY(-10px) scale(0.97)' : 'none',
          }}
        >
          <div
            className={`flex items-center justify-between gap-3 w-full h-12 px-4 rounded-2xl  transition-all duration-300 ${
              phase >= 1
                ? '   bg-white '
                : ' bg-[#faf9fe]'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <Search
                className={`w-4.5 h-4.5 transition-colors ${
                  phase >= 1 ? 'text-[#573ec9]' : 'text-[#94A3B8]'
                }`}
              />
              {/* 입력칸은 비워 둔 채로 시작한다 — 안내 문구가 있으면 타이핑이 «고쳐 쓰는»
                * 동작처럼 보인다. 빈 칸에서 시작해야 «검색한다»로 읽힌다. */}
              <div className="relative flex-1 text-[14px] font-medium text-[#1a1340]">
                <span className="font-semibold text-[#1a1340]">
                  {typedText}
                  {phase === 1 && (
                    <span className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-[#573ec9] animate-pulse" />
                  )}
                </span>
              </div>
            </div>

            {/* 우측 검색 아이콘 버튼 */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                phase >= 2
                  ? 'bg-[#573ec9] text-white  scale-100'
                  : 'bg-[#F0F5FA] text-[#94A3B8]'
              }`}
            >
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* 2. 쇼핑 바디 — **파란 장바구니 한 대**가 처음부터 끝까지 가운데 있다.
          * 화면을 갈아 끼우지 않는다. 타일도 값도 체크도 전부 이 카트 위에서 벌어진다. */}
        <div
          ref={stageRef}
          className="relative min-h-[250px] flex-1"
          style={{
            transformOrigin: 'center bottom',
            transform: phase >= 3 ? 'translateY(-5px) scale(1.04)' : 'none',
            transition: 'transform 820ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* A. 카테고리 타일 — 카트 위에 흩어져 떠 있다. 아무것도 고르지 않는다.
            * 떠 있는 동작은 **모든 타일에 똑같이** 걸려 있고, 고르는 순간에도 멈추지 않는다.
            * 그래서 층을 나눈다: 자리·등장(바깥) → 떠 있기(가운데) → 고름(안쪽). */}
          {TILES.map((tile, index) => {
            const palette = iconPalettes[tile.palette]
            const isMatch = index === MATCH_TILE
            const lifted = isMatch && phase >= 3 && phase <= 4
            const spot = TILE_SPOTS[index]

            return (
              <div
                key={tile.variant}
                className={`absolute z-20 transition-all duration-500 ease-out ${
                  phase >= 5 ? 'opacity-25' : lifted ? 'opacity-100' : 'opacity-90'
                }`}
                style={{
                  left: `${spot.left}%`,
                  top: spot.top,
                  opacity: opened ? undefined : 0,
                  transform: opened
                    ? `translateX(${phase >= 2 ? spot.spread : 0}px)`
                    : 'translateY(10px)',
                  transitionDelay: opened && phase === 0 ? `${index * 100}ms` : '0ms',
                }}
              >
                <div
                  className="animate-float-soft relative"
                  style={{ animationDelay: `${index * 320}ms` }}
                >
                  <div
                    ref={isMatch ? matchRef : undefined}
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95   transition-all duration-400 ease-out ${
                      lifted ? '' : ''
                    }`}
                    style={{ transform: lifted ? 'translateY(-10px) scale(1.1)' : 'none' }}
                  >
                    <FilledCategoryIcon
                      variant={tile.variant}
                      active={lifted}
                      palette={palette}
                      sizeClass="h-9 w-9"
                    />
                  </div>

                  {/* 담기 직전의 + 배지 */}
                  {isMatch && phase === 3 && (
                    <span className="animate-pop-in absolute -right-1.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#573ec9] text-[12px] font-bold leading-none text-white ">
                      +
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* B. 승인 단가 셋 — 바구니에서 올라와 가로로 선다 */}
          <div
            className={`absolute inset-x-2 top-[58px] z-30 flex items-end justify-center gap-2.5 transition-opacity duration-300 ${
              phase === 5 || phase === 6 ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {PRICES.map((price, index) => {
              const won = phase === 6 && index === LOWEST
              const lost = phase === 6 && index !== LOWEST
              const scatter = priceStage >= 2 ? { x: 0, y: 0, r: 0 } : SCATTER[index]
              const shownY = won ? -8 : lost ? 4 : 0

              return (
                <div
                  key={price}
                  ref={index === LOWEST ? lowestRef : undefined}
                  className={`relative flex h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl  transition-all duration-500 ease-out ${
                    won
                      ? ' bg-[#eafbf4] '
                      : ' bg-white '
                  }`}
                  style={{
                    opacity: priceStage === 0 ? 0 : lost ? 0.35 : 1,
                    transform:
                      priceStage === 0
                        ? 'translateY(22px)'
                        : `translate(${scatter.x}px, ${shownY + scatter.y}px) rotate(${scatter.r}deg) scale(${won ? 1.08 : lost ? 0.94 : 1})`,
                    transitionDelay: priceStage === 1 ? `${index * 100}ms` : '0ms',
                  }}
                >
                  {won && <Crown className="animate-pop-in absolute -top-4 h-4 w-4 text-[#f0a92b]" />}
                  <span
                    className={`text-[13px] font-semibold ${won ? 'text-[#077a52]' : 'text-[#64748B]'}`}
                  >
                    {price}
                  </span>
                  {won && (
                    <span className="rounded bg-[#077a52] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      최저가 선정
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* C. 구매완료 — 카트 위로 큰 체크가 뜬다 */}
          <div
            className={`absolute inset-x-0 top-[44px] z-30 flex flex-col items-center gap-2 transition-opacity duration-300 ${
              phase >= 8 ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {phase >= 8 && (
              <>
                <span className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-full bg-[#2fbf78] ">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9">
                    <path
                      d="m5 12.5 4.5 4.5L19 7.5"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="24"
                      className="animate-check-draw"
                    />
                  </svg>
                </span>
                <span className="animate-pop-in rounded-full bg-white px-4 py-1.5 text-[14px] font-bold text-[#1a1340] ">
                  구매완료
                </span>
              </>
            )}
          </div>

          {/* D. 장바구니 — 이 화면의 주인공. SVG 로 그린 한 대가 끝까지 남는다. */}
          <div
            ref={cartRef}
            className={`absolute bottom-0 left-1/2 z-10 h-[181px] w-[262px] -translate-x-1/2 transition-transform duration-500 ease-out ${
              phase >= 7 ? 'translate-x-[calc(-50%+16px)]' : ''
            }`}
          >
            {/* 바구니 «안»에 담긴 것들 — 카트 몸통이 아랫부분을 가려 준다 */}
            {/* 담기 전에는 **비어 있다.** 날아온 그 한 장만 들어가고, 아랫부분은
              * 카트 몸통이 가려 준다(같은 SVG 가 위에 그려진다). */}
            <div className="absolute inset-x-0 top-0 z-0 flex justify-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95    transition-all duration-500 ease-out"
                style={{
                  marginTop: 10,
                  opacity: cartCount > 0 ? 1 : 0,
                  transform: `translateY(${cartCount > 0 ? 0 : 14}px) rotate(-5deg)`,
                }}
              >
                <FilledCategoryIcon
                  variant={TILES[MATCH_TILE].variant}
                  active={false}
                  palette={iconPalettes[TILES[MATCH_TILE].palette]}
                  sizeClass="h-9 w-9"
                />
              </span>
            </div>

            {/* 날아오는 타일이 향하는 지점 — 바구니 입구 한가운데 */}
            <span ref={basketRef} className="absolute left-1/2 top-[66px] h-1 w-1 -translate-x-1/2" />

            <CartShape />
          </div>
        </div>

      </div>
    </div>
  )
}

/**
 * 장바구니 — 이 애니메이션의 유일한 고정 오브젝트.
 *
 * 아이콘 폰트의 카트 글리프로는 «안에 담기는» 그림이 안 나온다. 입이 열린 바구니가
 * 있어야 타일이 그 안으로 들어가고, 담긴 것이 얼굴을 내밀 수 있다. 그래서 직접 그린다.
 */
function CartShape() {
  return (
    <svg viewBox="0 0 260 180" aria-hidden="true" className="absolute inset-0 h-full w-full">
      <path d="M20 24h30a7 7 0 0 1 7 6l19 94h138a6 6 0 0 1 0 12H72a8 8 0 0 1-8-6L45 36H20a6 6 0 0 1 0-12Z" fill="#7960cf" />
      <path d="M58 52h177a9 9 0 0 1 9 11l-13 44a14 14 0 0 1-14 10H71Z" fill="#bdaaf1" />
      <path d="M58 52h177a9 9 0 0 1 9 11l-3 10H62Z" fill="#7960cf" />
      <circle cx="90" cy="153" r="12" fill="#7960cf" />
      <circle cx="207" cy="153" r="12" fill="#7960cf" />
    </svg>
  )
}
