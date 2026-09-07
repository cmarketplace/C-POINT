/**
 * 시즌 캘린더 — 명절·연말 예산 마감·환절기.
 *
 * 시즌은 할인 배너가 아니라 **배송 마감 카운트다운**이다. 공공기관의 가장 큰 시즌은
 * 「연말 예산 소진」이고, 명절은 «연휴 전 마지막 배송이 언제인가» 가 전부다.
 *
 * 날짜는 사람이 적는다(자동 계산 없음). 매년 갱신하는 자리라 여기 한 곳에 모았다.
 */

export interface SeasonEvent {
  key: string
  title: string
  /** 행사일 YYYY-MM-DD (KST). D-day 의 기준. */
  date: string
  /** 마감 안내 문구. 예) «9월 22일(월) 14시». 없으면 D-day 만 보여 준다. */
  deadline: string | null
  description: string
  /** 이 시즌 상품을 뽑는 검색어. 카탈로그 검색에 그대로 쓴다. */
  keywords: string[]
  /** 히어로 자리에 크게 걸 시즌인가. 하나만 켠다. */
  featured: boolean
}

export const SEASONS: readonly SeasonEvent[] = [
  {
    key: 'chuseok-2026',
    title: '추석',
    date: '2026-09-25',
    deadline: '9월 22일(월) 14시',
    description: '연휴 전 마지막 배송 마감입니다. 명절 선물세트는 기관 단체구매 단가로 준비했습니다.',
    keywords: ['선물세트', '한과', '명절'],
    featured: true,
  },
  {
    key: 'yearend-budget-2026',
    title: '연말 예산 마감',
    date: '2026-12-31',
    deadline: '12월 24일(목) 14시',
    description: '올해 예산으로 사는 마지막 배송 마감입니다. 내년 1분기 소모품을 미리 확보하세요.',
    keywords: ['복사용지', '토너', '볼펜'],
    featured: false,
  },
  {
    key: 'season-change-2026',
    title: '환절기 위생용품',
    date: '2026-10-15',
    deadline: null,
    description: '마스크·손소독제·티슈 사용량이 늘어나는 시기입니다.',
    keywords: ['마스크', '장갑', '티슈'],
    featured: false,
  },
]

/** KST 기준 오늘 날짜 YYYY-MM-DD. 서버가 UTC 여도 D-day 는 한국 날짜로 센다. */
export function kstToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** 행사일까지 남은 날. 지났으면 음수. */
export function daysUntil(date: string, today = kstToday()): number {
  const target = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10))
  const base = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10))
  return Math.round((target - base) / 86_400_000)
}

export function ddayLabel(days: number): string {
  if (days === 0) return 'D-DAY'
  return days > 0 ? `D-${days}` : `D+${-days}`
}

/** 아직 지나지 않은 시즌만, 가까운 순. */
export function upcomingSeasons(today = kstToday()): SeasonEvent[] {
  return SEASONS.filter(season => daysUntil(season.date, today) >= 0).sort(
    (a, b) => daysUntil(a.date, today) - daysUntil(b.date, today),
  )
}
