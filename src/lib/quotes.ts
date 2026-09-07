import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { calculateCartAmounts } from '@/lib/cart-amounts'
import type { OrderRoute } from '@/lib/order-types'
import { PostpaidMallError } from '@/lib/postpaid-mall-stub'
import {
  QUOTE_VALID_DAYS,
  type QuoteKind,
  type QuoteLine,
  type QuoteSubscription,
  type StorefrontQuote,
} from '@/lib/quote-types'

/**
 * 견적서 원장 — 몰이 발급하는 문서.
 *
 * 세모 주문 파이프라인에는 «견적서» 축이 없다(몰 주문은 접수 즉시 자동매칭이다). 담당자가
 * 품의에 붙일 종이는 몰이 만든다 — 그래서 이 원장은 세모 키 유무와 무관하게 **항상 몰
 * 안에** 있다. 주문에는 `quoteNo` 로만 연결된다.
 *
 * 저장: `var/quotes-stub.json` (.gitignore). 주문 스텁과 같은 구조 — 파일을 못 쓰는 환경에서는
 * 메모리로만 돈다. 견적서가 여러 인스턴스에 걸쳐 살아남아야 하는 시점이 오면 세모/씨마켓
 * 쪽에 견적 테이블을 두고 이 파일의 구현만 갈아 끼운다.
 */

interface QuoteState {
  version: 1
  quotes: StorefrontQuote[]
  quoteSeq: number
}

const STORE_PATH = path.join(process.cwd(), 'var', 'quotes-stub.json')

const globalStore = globalThis as unknown as { __mallQuotes?: QuoteState }

function loadState(): QuoteState {
  if (globalStore.__mallQuotes) return globalStore.__mallQuotes

  let state: QuoteState = { version: 1, quotes: [], quoteSeq: 0 }
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as QuoteState
    if (parsed?.version === 1) state = parsed
  } catch {
    // 첫 실행(파일 없음)이거나 손으로 고치다 깨진 경우 — 빈 원장에서 다시 시작한다.
  }

  globalStore.__mallQuotes = state
  return state
}

function saveState(state: QuoteState): void {
  globalStore.__mallQuotes = state
  try {
    mkdirSync(path.dirname(STORE_PATH), { recursive: true })
    writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8')
  } catch {
    // 파일을 못 쓰는 환경(서버리스)에서는 메모리로만 유지한다.
  }
}

function kstDateStamp(): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\D/g, '')
}

export interface CreateQuoteInput {
  memberId: string
  kind: QuoteKind
  route: OrderRoute | null
  lines: QuoteLine[]
  shipping: number
  subscription: QuoteSubscription | null
}

export function createQuote(input: CreateQuoteInput): StorefrontQuote {
  const state = loadState()

  const amounts =
    input.kind === 'SUBSCRIPTION' && input.subscription
      ? calculateCartAmounts([{ unitPrice: input.subscription.monthlyEstimate, quantity: 1 }])
      : calculateCartAmounts(
          input.lines.map(line => ({ unitPrice: line.unitPrice, quantity: line.quantity })),
          { shipping: input.shipping },
        )

  const suppliers = new Set(
    input.lines.map(line => line.supplierName ?? line.offerId ?? line.itemId),
  )

  state.quoteSeq += 1
  const now = new Date()
  const validUntil = new Date(now.getTime() + QUOTE_VALID_DAYS * 86_400_000)

  const quote: StorefrontQuote = {
    quoteNo: `Q-${kstDateStamp()}-${String(state.quoteSeq).padStart(4, '0')}`,
    kind: input.kind,
    memberId: input.memberId,
    createdAt: now.toISOString(),
    validUntil: validUntil.toISOString(),
    route: input.route,
    lines: input.lines,
    supply: amounts.supply,
    shipping: amounts.shipping,
    vat: amounts.vat,
    total: amounts.total,
    supplierCount: input.kind === 'SUBSCRIPTION' ? 1 : suppliers.size,
    subscription: input.subscription,
  }

  state.quotes.push(quote)
  saveState(state)
  return quote
}

export function listQuotes(memberId: string): StorefrontQuote[] {
  return loadState()
    .quotes.filter(quote => quote.memberId === memberId)
    .reverse()
}

/** 남의 견적서는 «없는 견적서» 다 — 주문 스텁과 같은 규칙. */
export function getQuote(memberId: string, quoteNo: string): StorefrontQuote {
  const quote = loadState().quotes.find(
    row => row.quoteNo === quoteNo && row.memberId === memberId,
  )
  if (!quote) throw new PostpaidMallError(404, '견적서를 찾을 수 없습니다.')
  return quote
}
