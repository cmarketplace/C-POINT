'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cookie, Package, SprayCan, FileText } from 'lucide-react'

import {
  BUNDLE_DISCOUNT_RATE,
  clampPeople,
  estimateMonthly,
  MAX_PEOPLE,
  MIN_PEOPLE,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from '@/config/subscriptions'
import { LoginRequiredError, requestQuote } from '@/lib/place-order'
import type { StorefrontQuote } from '@/lib/quote-types'

interface SubscriptionHeroProps {
  loggedIn: boolean
}

const won = (n: number) => n.toLocaleString('ko-KR')

const ICONS: Record<SubscriptionPlan['key'], typeof Cookie> = {
  clean: SprayCan,
  snack: Cookie,
  supply: Package,
}

/**
 * 정기구독 히어로 — 인원수 하나로 세 구독의 월 예산이 나온다.
 *
 * 위펀처럼 «몇 명인가» 가 첫 질문이다. 담당자는 품목을 고르기 전에 «한 달에 얼마인가» 를
 * 먼저 알아야 결재를 올릴 수 있다. 결재용 종이는 «구독 견적서» 로 바로 받는다.
 *
 * 금액은 예상 산식이다(`config/subscriptions.ts`). 화면이 그 사실을 숨기지 않는다.
 */
export default function SubscriptionHero({ loggedIn }: SubscriptionHeroProps) {
  const [peopleDraft, setPeopleDraft] = useState('30')
  const [frequency, setFrequency] = useState<Record<string, number>>(
    Object.fromEntries(SUBSCRIPTION_PLANS.map(plan => [plan.key, plan.defaultFrequency])),
  )
  const [quotes, setQuotes] = useState<Record<string, StorefrontQuote>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const people = clampPeople(Number.parseInt(peopleDraft, 10))
  const estimates = SUBSCRIPTION_PLANS.map(plan => ({
    plan,
    monthly: estimateMonthly(plan, people, frequency[plan.key] ?? plan.defaultFrequency),
  }))
  const total = estimates.reduce((sum, row) => sum + row.monthly, 0)
  const bundleSave = Math.round((total * BUNDLE_DISCOUNT_RATE) / 1000) * 1000

  const handleQuote = async (plan: SubscriptionPlan) => {
    setBusy(plan.key)
    setError(null)
    try {
      const quote = await requestQuote({
        kind: 'SUBSCRIPTION',
        planKey: plan.key,
        people,
        frequencyIndex: frequency[plan.key] ?? plan.defaultFrequency,
      })
      setQuotes(current => ({ ...current, [plan.key]: quote }))
    } catch (err) {
      setError(
        err instanceof LoginRequiredError
          ? '구독 견적서에는 기관·담당자가 실립니다. 씨마켓 계정으로 로그인해 주세요.'
          : err instanceof Error
            ? err.message
            : '견적서를 발급하지 못했습니다.',
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <section
      id="subscribe"
      className="scroll-mt-28 rounded-3xl bg-[linear-gradient(160deg,#f4f9fd_0%,#e5f2fa_60%,#dceefb_100%)] p-6 sm:p-8 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.6fr)] lg:gap-12">
        <div>
          <span className="text-primary ring-primary/35 inline-flex h-8 items-center rounded-full px-4 text-[13px] font-medium ring-1">
            정기구독
          </span>
          <h1 className="text-navy mt-5 break-keep text-[28px] leading-[1.25] font-semibold tracking-tight sm:text-[34px]">
            사무실 운영, 매달 챙기지 말고
            <br />
            <span className="text-primary">한 번만</span> 정하세요
          </h1>
          <p className="text-muted mt-4 text-[15px] leading-[1.8]">
            인원수만 넣으면 청소·간식·소모품 월 예산이 바로 나옵니다. 결재는 첫 달 한 번,
            이후는 자동 발주입니다.
          </p>

          <label className="mt-6 flex items-center gap-3 text-sm">
            <span className="text-text font-semibold">우리 사무실 인원</span>
            <input
              inputMode="numeric"
              value={peopleDraft}
              onChange={event => setPeopleDraft(event.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => setPeopleDraft(String(people))}
              aria-label="사무실 인원"
              className="text-text w-20 rounded-control border border-border bg-white px-3 py-2 text-right font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <span className="text-muted">명</span>
          </label>
          <p className="text-muted mt-2 text-xs">
            {MIN_PEOPLE}~{MAX_PEOPLE}명 · 예상 금액이며 견적 확정 시 달라질 수 있습니다
          </p>
        </div>

        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            {estimates.map(({ plan, monthly }) => {
              const Icon = ICONS[plan.key]
              const quote = quotes[plan.key]
              return (
                <article key={plan.key} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_-12px_rgba(1,35,80,0.25)]">
                  <span className="bg-blue-tint-2 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h2 className="text-text text-base font-semibold">{plan.name}</h2>
                    <p className="text-muted mt-1 min-h-[36px] text-xs leading-[1.6]">{plan.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${plan.name} 주기`}>
                    {plan.frequencies.map((item, index) => {
                      const active = (frequency[plan.key] ?? plan.defaultFrequency) === index
                      return (
                        <button
                          key={item.label}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setFrequency(current => ({ ...current, [plan.key]: index }))}
                          className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                            active
                              ? 'border-primary bg-blue-tint-2 text-primary font-semibold'
                              : 'border-border text-muted hover:text-text'
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="border-bg mt-auto border-t border-dashed pt-3">
                    <p className="text-muted text-[11px]">{people}명 기준 월 예상 · 부가세 별도</p>
                    <p className="text-text mt-0.5 text-xl font-semibold tabular-nums">{won(monthly)}원</p>
                  </div>
                  {quote ? (
                    <p className="bg-highlight-soft text-highlight-strong rounded-lg px-3 py-2 text-[11px] leading-4">
                      <FileText size={12} className="mr-1 inline-block" />
                      견적서 {quote.quoteNo} 발급 · 결재 후 연락 주시면 첫 배송을 잡습니다
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuote(plan)}
                      disabled={busy === plan.key}
                      className="text-primary hover:bg-blue-tint-2 h-10 cursor-pointer rounded-control border border-primary/40 text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {busy === plan.key ? '발급 중…' : '구독 견적서 받기'}
                    </button>
                  )}
                </article>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm">
            <span className="bg-highlight-soft text-highlight-strong rounded-full px-2.5 py-0.5 text-xs font-semibold">
              묶음 혜택
            </span>
            <span className="text-text">
              세 가지를 함께 구독하면 월{' '}
              <strong className="font-semibold tabular-nums">{won(bundleSave)}원</strong> 절감, 계산서는 한 장
            </span>
            {!loggedIn && (
              <Link href="/login?next=/shop" className="text-primary ml-auto text-xs font-semibold hover:underline">
                로그인하고 견적서 받기
              </Link>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-[#FDECEC] px-4 py-3 text-sm leading-5 text-[#B3261E]">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
