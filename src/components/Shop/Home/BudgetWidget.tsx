'use client'

import { useState, useSyncExternalStore } from 'react'

interface BudgetWidgetProps {
  /** 'YYYY-MM' (KST) */
  month: string
  /** 이번 달 청구 예정 합계(취소 제외) */
  spend: number
  orderCount: number
}

const STORAGE_KEY = 'cpoint.monthlyBudget'
const won = (n: number) => n.toLocaleString('ko-KR')

/* 월 예산 — 브라우저에만 저장하는 외부 스토어. 기관 예산 시스템과 이어지기 전의 자리표시다. */
let snapshot: number | null = null
let loaded = false
const listeners = new Set<() => void>()

function read(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const value = raw ? Number(raw) : NaN
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function getSnapshot() {
  if (!loaded) {
    snapshot = read()
    loaded = true
  }
  return snapshot
}
function getServerSnapshot() {
  return null
}
function setBudget(value: number | null) {
  snapshot = value
  loaded = true
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, String(value))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장 실패는 화면 상태에 영향이 없다.
  }
  listeners.forEach(notify => notify())
}

/**
 * 부서 예산 현황 — 이번 달 사용액을 담당자가 적어 둔 월 예산과 견준다.
 *
 * 예산은 기관 시스템에서 오지 않는다(아직). 담당자가 한 번 적어 두면 이 브라우저에 남고,
 * «연말까지 월평균 얼마 쓸 수 있는지» 를 같이 보여 준다 — 예산 마감 전 선구매를 유도하는 자리.
 */
export default function BudgetWidget({ month, spend, orderCount }: BudgetWidgetProps) {
  const budget = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const [year, monthNo] = month.split('-').map(Number)
  const monthsLeft = Math.max(1, 12 - monthNo + 1)
  const label = `${year}년 ${monthNo}월`

  const commit = () => {
    const value = Number.parseInt(draft.replace(/[^0-9]/g, ''), 10)
    setBudget(Number.isFinite(value) && value > 0 ? value : null)
    setEditing(false)
  }

  const ratio = budget ? Math.min(1, spend / budget) : 0
  const remaining = budget ? budget - spend : null

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted text-xs font-semibold">부서 예산 현황 · {label}</p>
        <button
          type="button"
          onClick={() => {
            setDraft(budget ? String(budget) : '')
            setEditing(true)
          }}
          className="text-primary cursor-pointer text-xs font-semibold hover:underline"
        >
          {budget ? '예산 수정' : '월 예산 적기'}
        </button>
      </div>

      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            inputMode="numeric"
            value={draft}
            onChange={event => setDraft(event.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={event => {
              if (event.key === 'Enter') commit()
              if (event.key === 'Escape') setEditing(false)
            }}
            placeholder="3000000"
            aria-label="월 예산"
            className="text-text w-40 rounded-control border border-border bg-white px-3 py-2 text-right text-sm font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <span className="text-muted text-sm">원</span>
          <button
            type="button"
            onClick={commit}
            className="bg-primary hover:bg-primary-dark h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold text-white transition-colors"
          >
            저장
          </button>
        </div>
      ) : (
        <>
          <div className="bg-bg mt-3 h-2 overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full transition-[width]" style={{ width: `${ratio * 100}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs tabular-nums">
            <span className="text-text">
              사용 {won(spend)}원 <span className="text-muted">· 주문 {orderCount}건</span>
            </span>
            <span className="text-muted">{budget ? `예산 ${won(budget)}원` : '예산 미설정'}</span>
          </div>
          {remaining !== null && (
            <p className="text-muted mt-3 text-xs leading-5">
              잔여 {won(Math.max(0, remaining))}원 · 연말까지 월평균{' '}
              {won(Math.max(0, Math.round(remaining / monthsLeft / 1000) * 1000))}원 쓸 수 있습니다.
              {remaining > 0 && ' 예산 마감 전 선구매 품목을 시즌 칸에서 추천합니다.'}
            </p>
          )}
        </>
      )}
      <p className="text-muted mt-3 text-[11px]">예산은 이 브라우저에만 저장됩니다.</p>
    </div>
  )
}
