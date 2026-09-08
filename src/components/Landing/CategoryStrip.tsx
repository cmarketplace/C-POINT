'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

import { SHOWCASE_CATEGORIES, type ShowcaseCategory } from '@/config/category-showcase'

/**
 * 카테고리 카드 줄 — 히어로와 2번 섹션 **사이의 낮은 띠**다.
 *
 * 섹션이 아니라 구분선에 가깝다. 여기서 할 말은 「이 몰에 이런 갈래가 있다」 한 줄뿐이라
 * 높이를 낮게 두고 카드만 남긴다 — 제목도, 설명도 붙이지 않는다.
 *
 * 2초마다 한 칸씩 **왼쪽으로만** 흐른다. 목록을 두 벌 이어 붙여 두고, 첫 벌을 다 지나면
 * 그 폭만큼 순간 되감는다 — 같은 그림이라 이음매가 안 보이고, 5번 다음에 1번이 자연스럽게
 * 이어진다. 오른쪽으로 되감기는 장면이 없어야 «흐르는 띠» 로 읽힌다.
 *
 * 손이 닿는 동안(끌기·호버), 화면 밖에 있는 동안, 고른 카드가 있는 동안에는 멈춘다.
 *
 * 누르면 그 카드가 «고른 상태» 로 선다(보라 테두리). 몰로 넘어가는 것은 화살표이고,
 * 이미 고른 카드를 한 번 더 누르는 것도 같은 뜻이다.
 */

/** 자동으로 한 칸 넘어가는 간격. */
const ROTATE_MS = 2000

const COUNT = SHOWCASE_CATEGORIES.length

export default function CategoryStrip() {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: 0, lastX: 0, velocity: 0 })
  const pausedRef = useRef(false)
  const visibleRef = useRef(true)
  const activeRef = useRef<string | null>(null)

  const [activeId, setActiveId] = useState<string | null>(null)
  const router = useRouter()

  // 자동 넘김 타이머는 effect 안에서만 이 값을 본다. 그려지는 값은 `activeId` 쪽이다.
  useEffect(() => {
    activeRef.current = activeId
  }, [activeId])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // 화면 밖에서까지 굴릴 이유가 없다.
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) visibleRef.current = entry.isIntersecting
      },
      { threshold: 0.2 }
    )
    observer.observe(track)

    const timer = setInterval(() => {
      if (pausedRef.current || dragRef.current.active || !visibleRef.current) return
      if (activeRef.current) return

      const cards = track.children
      const first = cards[0] as HTMLElement | undefined
      const second = cards[1] as HTMLElement | undefined
      const firstClone = cards[COUNT] as HTMLElement | undefined
      if (!first || !second || !firstClone) return

      // 한 칸 = 카드 폭 + 간격. 한 바퀴 = 첫 벌 전체 폭. 클래스에 박지 않고 실제 자리에서 잰다.
      const step = second.offsetLeft - first.offsetLeft
      const loopWidth = firstClone.offsetLeft - first.offsetLeft

      // 첫 벌을 다 지났으면 그 폭만큼 «순간» 되감는다. 뒤 벌이 같은 그림이라 티가 안 난다.
      if (track.scrollLeft >= loopWidth - 1) track.scrollLeft -= loopWidth

      track.scrollBy({ left: step, behavior: 'smooth' })
    }, ROTATE_MS)

    return () => {
      clearInterval(timer)
      observer.disconnect()
    }
  }, [])

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // 손가락은 브라우저가 알아서 굴린다(관성까지). 마우스 끌기만 직접 받는다.
    if (event.pointerType === 'touch') return
    const track = trackRef.current
    if (!track) return

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: 0,
      lastX: event.clientX,
      velocity: 0,
    }
    track.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag.active || !track) return

    const delta = event.clientX - drag.startX
    drag.moved = Math.abs(delta)
    drag.velocity = event.clientX - drag.lastX
    drag.lastX = event.clientX
    track.scrollLeft = drag.startScroll - delta
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag.active || !track) return

    drag.active = false
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId)

    // 놓은 속도만큼 조금 더 굴러간다. 멈춘 자리는 스냅이 잡아 준다.
    if (Math.abs(drag.velocity) > 4) {
      track.scrollBy({ left: -drag.velocity * 14, behavior: 'smooth' })
    }
  }

  /**
   * 카드 한 장. 뒤 벌(`cloned`)은 이어 붙이기용이라 눌리지도, 읽히지도 않는다 —
   * 같은 링크가 두 번 있으면 키보드와 스크린리더에 같은 자리가 두 번 나온다.
   */
  const renderCard = (category: ShowcaseCategory, key: string, cloned: boolean) => {
    const href = `/shop/products?q=${encodeURIComponent(category.label)}`
    const isActive = activeId === category.id
    const fill = ({ office: '#eee8fb', snack: '#fff0df', reagent: '#e6f3ec', post: '#e7effb', supplies: '#f9e8ed' } as Record<string, string>)[category.id]


    return (
      <div
        key={key}
        aria-hidden={cloned || undefined}
        className="relative h-[182px] w-full shrink-0 snap-start sm:h-[194px] sm:w-[calc((100%-20px)/2)] lg:h-[204px] lg:w-[calc((100%-40px)/3)]"
      >
        <button
          type="button"
          aria-pressed={cloned ? undefined : isActive}
          tabIndex={cloned ? -1 : undefined}
          onClick={() => {
            if (cloned) return
            // 끌어서 옮긴 뒤 손을 떼면 «누른 것» 으로 치지 않는다.
            if (dragRef.current.moved > 8) return
            if (isActive) router.push(href)
            else setActiveId(category.id)
          }}
          className={`group h-full w-full cursor-pointer overflow-hidden rounded-lg text-left transition-all duration-300 ease-out ${
            isActive
              ? '-translate-y-0.5 brightness-[0.97]'
              : 'hover:brightness-[0.98]'
          }`}
          style={{ backgroundColor: fill }}
        >
          <span className="flex h-full w-full">
            {/* 카피 — 왼쪽 42% */}
            <span className="relative z-[2] flex w-[48%] flex-col justify-between py-4 pr-2 pl-5 sm:py-5 sm:pl-6">
              <span className="block">
                <span
                  className={`block text-[12px] font-semibold transition-colors sm:text-[13px] ${
                    isActive ? 'text-violet-strong' : 'text-violet'
                  }`}
                >
                  {category.label}
                </span>

                {/* 두 줄이 상한이다 — 글자가 길어져도 세 줄로 흐르지 않게 잘라 둔다. */}
                <span className="text-text mt-2 line-clamp-2 block text-[17px] leading-[1.38] font-semibold sm:text-[19px]">
                  {category.lines[0]}
                  <br />
                  {category.lines[1]}
                </span>
              </span>

              {/* 화살표 자리 — 실제 링크는 이 위에 겹쳐 둔다(버튼 안에 링크를 넣지 않으려고) */}
              <span aria-hidden="true" className="block h-8 w-8" />
            </span>

            {/* 상품 — 오른쪽 58%. 사진이 없으면 같은 자리를 빈 면으로 잡아 둔다. */}
            <span className="relative block w-[52%]">
              {category.image && (
                <Image
                  src={category.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 230px, (min-width: 640px) 208px, 44vw"
                  className={`object-contain p-3 transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04] ${
                    isActive ? '-translate-y-1 scale-[1.04]' : ''
                  }`}
                />
              )}
            </span>
          </span>
        </button>

        {/* 몰로 넘어가는 문 */}
        {!cloned && (
          <Link
            href={href}
            aria-label={`${category.label} 보러 가기`}
            onClick={event => {
              if (dragRef.current.moved > 8) event.preventDefault()
            }}
            className={`group/arrow absolute bottom-3 left-4 z-[3] flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:bottom-4 sm:left-5 ${
              isActive ? 'bg-violet-soft text-violet-strong' : 'text-muted hover:bg-bg'
            }`}
          >
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 group-hover/arrow:translate-x-0.5"
            />
          </Link>
        )}
      </div>
    )
  }

  return (
    <section aria-label="카테고리" className="w-full px-4 py-3 sm:px-6 sm:py-5">
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={() => {
          pausedRef.current = true
        }}
        onPointerLeave={() => {
          pausedRef.current = false
        }}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto py-4 [scrollbar-width:none] select-none sm:gap-5 [&::-webkit-scrollbar]:hidden"
      >
        {SHOWCASE_CATEGORIES.map(category => renderCard(category, category.id, false))}

        {/* 이어 붙이는 두 번째 벌 — 5번 다음에 1번이 끊김 없이 오게 한다 */}
        {SHOWCASE_CATEGORIES.map(category => renderCard(category, `${category.id}-loop`, true))}
      </div>
    </section>
  )
}
