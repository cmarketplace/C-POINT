import Link from 'next/link'

/**
 * 히어로 — 디자인 시스템 §5 의 「A. 표지」 원형.
 *
 * 지켜야 할 것 넷:
 *  1. 흰 배경 · 넓은 여백. 진한 색 면으로 채우지 않는다(챕터 표지 밖에서는 금지).
 *  2. **타이틀은 2줄이 표준.** 의미 단위로 직접 개행한다.
 *  3. 강조는 색으로 한다 — 한 문장에서 핵심어 하나만 primary 로 바꾼다. 크기로 하지 않는다.
 *  4. 본문은 타이틀보다 한참 작고 회색이며 굵게 하지 않는다.
 *
 * 떠 있는 카드 두 장은 «지어낸 지표» 가 아니라 **이 몰이 실제로 하는 일의 UI 조각**이다.
 * 참고한 레퍼런스는 여기에 「350%」 같은 숫자 카드를 띄웠는데, 그 자리에 근거 없는 수치를
 * 넣는 것은 디자인 시스템 §2 「근거 없는 최상급 표현」 금지에 정면으로 걸린다. 그래서
 * 카드에는 숫자를 빼고 구조만 남겼다 — 실측값은 아래 `Stats` 가 스냅샷에서 가져온다.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 시그니처 ⑧ 방사형 옅은 광 — 흰 배경의 단조로움만 덜어내는 수준으로. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(60%_70%_at_50%_0%,var(--color-blue-tint-2)_0%,var(--color-blue-tint)_45%,transparent_100%)]"
      />

      {/* 시그니처 ① 대각선 그라데이션 스트라이프 — 굵기 다른 선을 나란히, 화면 밖으로 뻗는다.
        * 표지에서만 쓴다(본문 섹션에는 쓰지 않는다).
        *
        * 좁은 화면에서는 내린다. 코너가 작아 스트라이프가 eyebrow 줄을 가로질러
        * 「씨마켓 큐레이션 구매」 위로 겹쳐 읽혔다 — 장식이 카피를 방해하면 장식이 진다. */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 hidden h-64 w-[520px] -rotate-45 opacity-70 sm:block">
        <div className="from-brand-from to-brand-to h-3 w-full rounded-full bg-gradient-to-r" />
        <div className="from-brand-from to-brand-to mt-4 h-1.5 w-4/5 rounded-full bg-gradient-to-r opacity-70" />
        <div className="from-brand-from to-brand-to mt-3 h-1 w-3/5 rounded-full bg-gradient-to-r opacity-45" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-28 hidden h-52 w-[420px] -rotate-45 opacity-55 sm:block">
        <div className="from-brand-to to-brand-from h-2.5 w-full rounded-full bg-gradient-to-r" />
        <div className="from-brand-to to-brand-from mt-3.5 h-1.5 w-2/3 rounded-full bg-gradient-to-r opacity-70" />
      </div>

      <div className="container-content relative px-5 pt-16 pb-14 sm:px-10 sm:pt-24 sm:pb-20">
        <div className="relative mx-auto max-w-3xl text-center">
          {/* eyebrow — 15~16px / 500 / Primary Blue */}
          <p className="text-primary flex items-center justify-center gap-2 text-[15px] font-medium">
            <span className="bg-primary inline-block h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            씨마켓 큐레이션 구매
          </p>

          {/* 타이틀 2줄. 핵심어 하나만 파랑. */}
          <h1 className="text-text mt-5 text-[34px] leading-[1.28] font-semibold sm:text-[52px]">
            기관 구매에 필요한 것만,
            <br />
            <span className="text-primary">검증된 단가</span>로 모았습니다
          </h1>

          <p className="text-muted mx-auto mt-7 max-w-xl text-[15px] leading-[1.8] sm:text-[17px]">
            세모 물품관리시스템이 「이 몰 × 품목 × 공급사」로 승인한 조합만 목록에 오릅니다.
            같은 품목을 여러 곳이 대면 언제나 그중 가장 싼 값으로 담깁니다.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="bg-primary hover:bg-primary-dark flex h-13 items-center rounded-control px-7 text-sm font-semibold text-white transition-colors"
            >
              상품 보러 가기
            </Link>
            {/* 보조 액션도 면으로 구분한다 — 테두리 버튼은 쓰지 않는다. */}
            <Link
              href="#contrast"
              className="bg-bg text-text hover:bg-bg-secondary flex h-13 items-center rounded-control px-7 text-sm font-semibold transition-colors"
            >
              무엇이 달라지나
            </Link>
          </div>
        </div>

        {/* ── 떠 있는 카드 ──────────────────────────────────────
          * 좁은 화면에서는 내린다. 폭 350px 에 카드를 띄우면 타이틀 위로 겹쳐 글이 안 읽힌다. */}
        <FloatingOfferCard />
        <FloatingApprovalCard />

      </div>
    </section>
  )
}

/**
 * 「같은 품목, 여러 공급처」 카드.
 *
 * 상세 화면의 `OfferList` 가 실제로 그리는 구조 그대로다 — 1번만 값이 살아 있고 나머지는
 * 취소선으로 죽는다. 숫자를 넣지 않은 이유: 이 몰에 아직 승인 품목이 없어서 여기 적을 수
 * 있는 실제 단가가 없다. 막대만으로도 «여러 곳 중 하나가 최저가로 뽑힌다» 는 읽힌다.
 */
function FloatingOfferCard() {
  return (
    <div className="absolute top-40 left-[calc(50%-38rem)] hidden xl:block">
      <div className="w-56 -rotate-[6deg] rounded-md bg-white p-4 shadow-[0_18px_44px_rgba(20,40,80,0.10)]">
        <p className="text-muted text-[11px] font-medium">이 상품을 대는 곳</p>

        <ul className="mt-3 space-y-2.5">
          <li className="flex items-center gap-2">
            <span className="bg-highlight-soft text-highlight-strong rounded-xs px-1.5 py-0.5 text-[10px] font-semibold">
              최저가
            </span>
            <span className="bg-highlight h-1.5 flex-1 rounded-full" />
          </li>
          <li className="flex items-center gap-2 opacity-45">
            <span className="text-muted w-[38px] text-[10px]">공급처 2</span>
            <span className="bg-border h-1.5 flex-1 rounded-full" />
          </li>
          <li className="flex items-center gap-2 opacity-45">
            <span className="text-muted w-[38px] text-[10px]">공급처 3</span>
            <span className="bg-border h-1.5 flex-1 rounded-full" />
          </li>
        </ul>

        <p className="text-muted mt-3 text-[10px] leading-4">
          어디서 오는지는 공개되지 않습니다
        </p>
      </div>

      {/* 시그니처 ② 파란 점선 커넥터 + 도트. 카드 안에 두어야 본문 옆에 붙어 따라다닌다. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 96 56"
        className="text-accent-dark pointer-events-none absolute -right-[5.5rem] bottom-3 h-14 w-24"
      >
        <path
          d="M2 48 C 26 44, 48 22, 74 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
        <circle cx="78" cy="7" r="4" className="fill-primary" />
      </svg>
    </div>
  )
}

/** 「세모 승인」 카드. 이 몰의 상품이 어디서 오는지를 한 줄로 말한다. */
function FloatingApprovalCard() {
  return (
    <div className="absolute top-52 right-[calc(50%-38rem)] hidden w-52 rotate-[5deg] rounded-md bg-white p-4 shadow-[0_18px_44px_rgba(20,40,80,0.10)] xl:block">
      <div className="flex items-center gap-2.5">
        <span className="bg-blue-tint-2 text-primary flex h-8 w-8 items-center justify-center rounded-control">
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
            <circle cx="10" cy="10" r="9" className="fill-primary" />
            <path d="m6 10.2 2.6 2.6L14 7.4l-1.5-1.5-3.9 3.9-1.1-1.1L6 10.2Z" fill="#fff" />
          </svg>
        </span>
        <p className="text-text text-[13px] font-semibold">세모 승인 품목</p>
      </div>

      <p className="text-muted mt-3 text-[11px] leading-5">
        이 몰 × 품목 × 공급사
        <br />
        세 축이 모두 승인된 것만
      </p>
    </div>
  )
}
