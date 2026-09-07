'use client'

import {
  COMBINATION_LABEL,
  type CombinationMode,
  type CombinationResult,
} from '@/lib/cart-combination'

interface CombinationModesProps {
  mode: CombinationMode
  byMode: Record<CombinationMode, CombinationResult | null>
  canSingle: boolean
  onChange: (mode: CombinationMode) => void
}

const won = (n: number) => n.toLocaleString('ko-KR')

/**
 * 조합 방식 세 장 — 총액 옆에 **업체 수·배송 건수·계산서 장수**.
 *
 * 절감액만 크게 쓰면 담당자는 싼 조합을 고르고 나서 계산서 세 장에 놀란다. 서류 수를
 * 같은 크기로 나란히 두면 «6천 원 아끼고 계산서 두 장 더» 를 보고 고른다.
 */
export default function CombinationModes({ mode, byMode, canSingle, onChange }: CombinationModesProps) {
  const best = byMode.best!
  const single = byMode.single
  const manual = byMode.manual!

  // 줄마다 최저가라도 배송비가 업체 수만큼 붙으면 한 곳으로 모는 편이 쌀 수 있다 —
  // 그때는 «절감» 이 아니라 «배송비까지는 단일 업체가 싸다» 라고 말해야 한다.
  const bestTotal = best.supply + best.shipping
  const singleTotal = single ? single.supply + single.shipping : null
  const diff = singleTotal !== null ? singleTotal - bestTotal : null

  const cards: {
    key: CombinationMode
    result: CombinationResult | null
    note: string
    tone?: 'save'
  }[] = [
    {
      key: 'best',
      result: best,
      note:
        diff === null
          ? '줄마다 가장 싼 업체'
          : diff > 0
            ? `단일 업체보다 ${won(diff)}원 절감`
            : `상품값은 최저지만 배송비 ${won(best.shipping)}원이 붙습니다`,
      tone: diff !== null && diff > 0 ? 'save' : undefined,
    },
    {
      key: 'single',
      result: single,
      note: single
        ? diff !== null && diff < 0
          ? `배송비까지 합치면 ${won(-diff)}원 더 쌉니다 · 계산서 1장`
          : '배송 1건 · 계산서 1장 · 검수 1번'
        : '모든 품목을 한 곳에서 댈 수 있을 때만',
      tone: diff !== null && diff < 0 ? 'save' : undefined,
    },
    {
      key: 'manual',
      result: manual,
      note: '품목마다 업체를 지정합니다',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="업체 조합 방식">
      {cards.map(card => {
        const active = mode === card.key
        const disabled = card.key === 'single' && !canSingle
        const total = card.result ? card.result.supply + card.result.shipping : null
        const n = card.result?.supplierCount ?? 0
        return (
          <button
            key={card.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(card.key)}
            className={`flex cursor-pointer flex-col gap-1.5 rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              active ? 'border-primary bg-blue-tint' : 'border-border bg-white hover:bg-light-soft'
            }`}
          >
            <span className="text-text text-sm font-semibold">{COMBINATION_LABEL[card.key]}</span>
            {card.result && (
              <span className="text-muted flex flex-wrap gap-x-2.5 text-[11px]">
                <span>업체 {n}곳</span>
                <span>배송 {n}건</span>
                <span>계산서 {n}장</span>
              </span>
            )}
            <span className="text-text text-lg font-semibold tabular-nums">
              {total !== null ? `${won(total)}원` : '—'}
            </span>
            <span
              className={`text-[11px] leading-4 ${
                card.tone === 'save' && !disabled ? 'text-highlight-strong font-semibold' : 'text-muted'
              }`}
            >
              {card.note}
            </span>
          </button>
        )
      })}
    </div>
  )
}
