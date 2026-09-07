'use client'

import { useState, useSyncExternalStore } from 'react'
import { BellRing, X } from 'lucide-react'

import {
  clearPriceWatch,
  getPriceWatchServerSnapshot,
  getPriceWatchSnapshot,
  setPriceWatch,
  subscribePriceWatch,
} from '@/lib/price-watch'

interface PriceWatchButtonProps {
  productId: string
  /** 지금 최저 단가. 기본 관심 가격(−5%)의 기준이다. */
  currentPrice: number
}

const won = (n: number) => n.toLocaleString('ko-KR')

/**
 * «이 가격 아래로» — 관심 가격을 적어 두는 버튼.
 *
 * 저장은 이 브라우저에만 된다(`price-watch.ts`). 알림 발송 축이 아직 없으므로 버튼 문구가
 * «알림» 을 약속하지 않는다 — 다음에 열었을 때 «관심 가격 도달» 로 보여 주는 것까지가 지금이다.
 */
export default function PriceWatchButton({ productId, currentPrice }: PriceWatchButtonProps) {
  const watches = useSyncExternalStore(
    subscribePriceWatch,
    getPriceWatchSnapshot,
    getPriceWatchServerSnapshot,
  )
  const watch = watches.find(row => row.productId === productId) ?? null
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const suggested = Math.max(1, Math.round((currentPrice * 0.95) / 100) * 100)

  if (watch) {
    const reached = currentPrice <= watch.targetPrice
    return (
      <span className="inline-flex items-center gap-1">
        <span
          className={`flex h-12 items-center gap-2 rounded-control px-4 text-sm font-semibold ${
            reached ? 'bg-highlight-soft text-highlight-strong' : 'bg-bg text-text'
          }`}
        >
          <BellRing size={16} strokeWidth={1.8} />
          관심 가격 {won(watch.targetPrice)}원 {reached ? '· 도달' : '이하'}
        </span>
        <button
          type="button"
          onClick={() => clearPriceWatch(productId)}
          aria-label="관심 가격 지우기"
          className="text-muted hover:text-text flex h-12 w-10 cursor-pointer items-center justify-center rounded-control transition-colors"
        >
          <X size={16} />
        </button>
      </span>
    )
  }

  if (editing) {
    const commit = () => {
      const value = Number.parseInt(draft.replace(/[^0-9]/g, ''), 10)
      if (Number.isFinite(value) && value > 0) setPriceWatch(productId, value)
      setEditing(false)
    }
    return (
      <span className="inline-flex h-12 items-center gap-2 rounded-control border border-border bg-white px-3">
        <span className="text-muted text-xs">이 가격 이하면</span>
        <input
          autoFocus
          inputMode="numeric"
          value={draft}
          onChange={event => setDraft(event.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={event => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') setEditing(false)
          }}
          placeholder={String(suggested)}
          aria-label="관심 가격"
          className="text-text w-24 bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
        />
        <span className="text-muted text-xs">원</span>
        <button
          type="button"
          onClick={commit}
          className="bg-primary hover:bg-primary-dark h-8 cursor-pointer rounded-lg px-3 text-xs font-semibold text-white transition-colors"
        >
          저장
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(String(suggested))
        setEditing(true)
      }}
      className="text-text hover:bg-bg flex h-12 cursor-pointer items-center gap-2 rounded-control border border-border bg-white px-4 text-sm font-semibold transition-colors"
    >
      <BellRing size={16} strokeWidth={1.8} />
      관심 가격 적어 두기
    </button>
  )
}
