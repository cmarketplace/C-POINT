'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * 섹션 진입 모션 — 02·03·04 가 같은 리듬으로 들어온다.
 *
 *   제목  ─ 650ms ─▶
 *      └ 180ms 뒤 카드 ─ 800ms ─▶
 *            └ 카드가 다 앉은 뒤에야 카드 **안쪽** 애니메이션이 시작된다
 *
 * 일관성은 «제목 + 카드»의 등장에서만 온다. 카드 안에서 무엇이 움직이는지는 섹션마다
 * 달라도 된다 — 같은 연출을 세 번 반복하면 세 번째 섹션은 아무도 안 본다.
 *
 * 되감아 올라가도 다시 재생하지 않는다. 스크롤할 때마다 글자가 다시 떠오르면
 * 읽던 자리를 놓친다(관찰자는 한 번 걸리면 `disconnect`).
 *
 * 모션 최소화 설정에서는 `globals.css` 의 전역 규칙이 transition 을 0 으로 만들어
 * 결과 상태만 즉시 보인다 — 여기서 따로 분기하지 않는다.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const TITLE_MS = 600
export const CARD_DELAY_MS = 180
export const CARD_MS = 800

/** 카드가 완전히 앉는 시점. 카드 안쪽 애니메이션은 이때부터 돈다. */
export const CARD_SETTLED_MS = CARD_DELAY_MS + CARD_MS

/** 기본값 `true` — 감싸는 섹션이 없으면 게이트 없이 그냥 보인다. */
const RevealContext = createContext(true)

export function useRevealed() {
  return useContext(RevealContext)
}

export function RevealSection({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // 25% ~ 35% 섹션 노출 시 1회 발동
    const ratio = Math.min(0.28, (window.innerHeight * 0.6) / Math.max(el.offsetHeight, 1))

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= ratio - 0.001) {
            setRevealed(true)
            observer.disconnect()
          }
        }
      },
      { threshold: ratio }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      id={id}
      data-revealed={revealed ? 'true' : 'false'}
      className={`${className || ''} ${revealed ? 'is-visible has-animated' : ''}`}
    >
      <RevealContext.Provider value={revealed}>{children}</RevealContext.Provider>
    </section>
  )
}

/** 제목 — 전체 제목은 600ms 동안 opacity 0→1, translateY(14px→0)으로 등장 */
export function RevealTitle({ children, className }: { children: ReactNode; className?: string }) {
  const revealed = useRevealed()

  return (
    <div
      data-revealed={revealed ? 'true' : 'false'}
      className={`${className || ''} ${revealed ? 'is-visible has-animated' : ''}`}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'none' : 'translateY(14px)',
        transition: `opacity ${TITLE_MS}ms ${EASE}, transform ${TITLE_MS}ms ${EASE}`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

/** 카드 — 날아오지 않는다. 살짝 내려앉는다(28px · 0.985배). */
export function RevealCard({ children, className }: { children: ReactNode; className?: string }) {
  const revealed = useRevealed()

  return (
    <div
      className={className}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'none' : 'translateY(28px) scale(0.985)',
        transition: `opacity ${CARD_MS}ms ${EASE} ${CARD_DELAY_MS}ms, transform ${CARD_MS}ms ${EASE} ${CARD_DELAY_MS}ms`,
      }}
    >
      {children}
    </div>
  )
}
