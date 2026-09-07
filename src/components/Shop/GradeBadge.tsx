import { GRADE_COPY, type PriceGrade } from '@/lib/offer-pricing'

interface GradeBadgeProps {
  grade: PriceGrade | null
  /** 배지 옆 긴 설명까지 붙일지. 목록 카드는 짧게, 상세는 길게. */
  detail?: boolean
  className?: string
}

/**
 * 낙찰가 대비 등급 배지 — A/B/C.
 *
 * 색은 씨마켓 토큰 안에서만 고른다: A 는 민트(성공), B 는 파랑(중립), C 는 오류 톤.
 * 기준값이 없으면 아무것도 그리지 않는다 — 배지가 없는 것이 «모른다» 는 뜻이다.
 */
export default function GradeBadge({ grade, detail = false, className = '' }: GradeBadgeProps) {
  if (!grade) return null

  const tone =
    grade === 'A'
      ? 'bg-highlight-soft text-highlight-strong'
      : grade === 'B'
        ? 'bg-blue-tint-2 text-primary'
        : 'bg-[#FDECEC] text-[#B3261E]'

  const copy = GRADE_COPY[grade]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone} ${className}`}
      title={copy.long}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {grade} · {detail ? copy.long : copy.short}
    </span>
  )
}
