import Link from 'next/link'

/**
 * 히어로 — 옅은 파랑 틴트 위의 «모노톤 일러스트» 형.
 *
 * 한 색 계열만 쓴다. 배경 틴트 → 배경 선 → 장바구니 → 타이틀까지 전부 파랑 한 축이고,
 * 다른 색상환을 끌어오지 않는다. 디자인 시스템 §3 의 「파랑·시안·민트·회색만」과 같은 결론.
 *
 * 타이틀은 navy, 핵심어만 primary 다. 같은 계열 안에서 명도로만 강조가 갈리므로 §4 의
 * 「강조는 색으로, 크기로 하지 않는다」를 지키면서 모노톤도 깨지지 않는다.
 * 대비 실측: navy on #E5F2FA = 13.5:1, primary on #E5F2FA = 4.5:1 (둘 다 AA).
 *
 * 장바구니에 담기는 것은 실험실 소모품이다 — 이 몰이 실제로 파는 품목이라야 첫 화면이
 * 무엇을 파는 곳인지 말해 준다. 참고한 레퍼런스의 옷·가방을 그대로 두면 남의 몰이 된다.
 */
export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[640px] items-center overflow-hidden bg-[linear-gradient(160deg,#f4f9fd_0%,#e5f2fa_55%,#dceefb_100%)] lg:min-h-[86vh]">
      <BackgroundTracks />

      <div className="container-content relative w-full px-5 py-20 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          {/* 아웃라인 pill — 면을 깔지 않고 테두리만. 레퍼런스의 「인사이트」 자리. */}
          <span className="text-primary ring-primary/35 inline-flex h-9 items-center rounded-full px-5 text-[13px] font-medium ring-1">
            씨마켓 큐레이션 구매
          </span>

          <h1 className="text-navy mt-7 text-[40px] leading-[1.2] font-semibold tracking-tight sm:text-[54px] lg:text-[64px]">
            기관 구매에 필요한 것만,
            <br />
            <span className="text-primary">검증된 단가</span>로
          </h1>

          <p className="text-muted mx-auto mt-7 max-w-xl text-[15px] leading-[1.85] sm:text-[17px]">
            세모 물품관리시스템이 「이 몰 × 품목 × 공급사」로 승인한 조합만 목록에 오릅니다.
            같은 품목을 여러 곳이 대면 언제나 그중 가장 싼 값으로 담깁니다.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="bg-primary hover:bg-primary-dark flex h-13 items-center rounded-control px-8 text-sm font-semibold text-white transition-colors"
            >
              상품 보러 가기
            </Link>
            <Link
              href="#contrast"
              className="text-primary ring-primary/30 flex h-13 items-center rounded-control bg-white/70 px-8 text-sm font-semibold ring-1 transition-colors hover:bg-white"
            >
              무엇이 달라지나
            </Link>
          </div>
        </div>

        {/* 일러스트는 텍스트 아래 가운데. */}
        <div className="mt-14 lg:mt-16">
          <BasketIllustration />
        </div>
      </div>
    </section>
  )
}

/**
 * 배경 선 — 라운드 트랙 · 점선 · 원형 노드.
 *
 * 대비를 낮게 유지한다. 이 선들이 눈에 띄기 시작하면 타이틀이 진다.
 * `slice` 로 잘라내므로 화면 비율이 바뀌어도 선이 찌그러지지 않는다.
 */
function BackgroundTracks() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="text-primary pointer-events-none absolute inset-0 -z-10 h-full w-full"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" opacity="0.16">
        <rect x="-160" y="-220" width="620" height="620" rx="200" />
        <rect x="1080" y="-300" width="700" height="700" rx="240" />
        <rect x="240" y="520" width="900" height="640" rx="260" />
        <rect x="1240" y="440" width="560" height="560" rx="190" />
      </g>

      <g fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="12 14" opacity="0.22">
        <path d="M0 250 H520" />
        <path d="M1010 170 H1600" />
        <path d="M0 690 H360" />
        <path d="M1120 760 H1600" />
        <path d="M760 0 V150" />
      </g>

      {/* 원형 노드 — 흰 면 + 파란 링. 선이 만나는 자리에만 둔다. */}
      <g opacity="0.5">
        <TrackNode cx={520} cy={250} />
        <TrackNode cx={1010} cy={170} />
        <TrackNode cx={360} cy={690} />
        <TrackNode cx={1120} cy={760} />
      </g>
    </svg>
  )
}

function TrackNode({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r="20" fill="#ffffff" />
      <circle cx={cx} cy={cy} r="20" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.55" />
      <circle cx={cx} cy={cy} r="8" fill="currentColor" opacity="0.45" />
    </>
  )
}

/**
 * 장바구니 + 쏟아져 들어가는 카드.
 *
 * 바구니는 SVG(플랫 단색), 카드는 HTML 이다 — 프로스티드 유리는 `backdrop-blur` 로만
 * 나오는데 SVG 안에서는 그 필터가 배경을 못 읽는다. 그래서 층을 나눴다.
 */
function BasketIllustration() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[560px]">
      {/* 카드가 바구니 «뒤» 에서 올라와 «앞» 으로 담기도록 층을 세 겹으로 쌓는다. */}
      <FrostedCard className="top-[8%] left-[16%] h-[86px] w-[74px] -rotate-[18deg] sm:h-[104px] sm:w-[90px]">
        <FlaskIcon />
      </FrostedCard>
      <FrostedCard className="top-[2%] left-[42%] h-[80px] w-[70px] rotate-[8deg] sm:h-[96px] sm:w-[84px]">
        <PetriIcon />
      </FrostedCard>
      <FrostedCard className="top-[13%] right-[14%] h-[84px] w-[72px] rotate-[21deg] sm:h-[100px] sm:w-[88px]">
        <MaskIcon />
      </FrostedCard>

      <svg viewBox="0 0 560 448" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* 손잡이 — 바구니보다 먼저 그려 뒤로 보낸다. */}
        <path
          d="M96 236 V196 a44 44 0 0 1 44 -44 h34"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* 바구니 — 위가 넓은 사다리꼴. 아래 모서리만 둥글다. */}
        <path
          d="M92 232 H500 L446 404 a24 24 0 0 1 -23 17 H169 a24 24 0 0 1 -23 -17 Z"
          fill="var(--color-primary)"
        />

        {/* 담긴 것들의 그림자 — 형태를 그리지 않고 번진 덩어리로만 둔다. */}
        <g filter="url(#soften)" opacity="0.5">
          <ellipse cx="216" cy="300" rx="52" ry="22" fill="var(--color-navy)" />
          <ellipse cx="356" cy="292" rx="44" ry="18" fill="var(--color-navy)" />
          <ellipse cx="288" cy="344" rx="62" ry="20" fill="var(--color-navy)" />
        </g>

        {/* 위 테두리 하이라이트 — 바구니 안쪽이 비어 보이지 않게. */}
        <path d="M92 232 H500 l-8 26 H100 Z" fill="#ffffff" opacity="0.22" />

        <defs>
          <filter id="soften" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
      </svg>

      {/* 바구니 «앞» 으로 걸쳐지는 카드 — 담기는 중인 것. */}
      <FrostedCard className="top-[38%] left-[26%] h-[90px] w-[78px] -rotate-[9deg] sm:h-[108px] sm:w-[94px]">
        <BeakerIcon />
      </FrostedCard>
    </div>
  )
}

/** 프로스티드 카드 — 반투명 흰 면 + backdrop blur + 밝은 테두리. */
function FrostedCard({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      className={`text-primary absolute z-10 flex items-center justify-center rounded-[18px] bg-white/55 shadow-[0_16px_34px_-12px_rgba(1,35,80,0.35)] ring-1 ring-white/70 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  )
}

/* ── 아이콘 ──────────────────────────────────────────────
 * 실루엣으로만 그린다. 선 아이콘을 쓰면 배경 선과 굵기가 겹쳐 둘 다 지저분해진다. */

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9 sm:h-11 sm:w-11">
      <path d="M9.4 2.4h5.2v1.7h-1.1v5.2l5 9.7c.6 1.2-.2 2.6-1.6 2.6H6.1c-1.4 0-2.2-1.4-1.6-2.6l5-9.7V4.1H9.4z" />
    </svg>
  )
}

function PetriIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9 sm:h-11 sm:w-11">
      <circle cx="12" cy="12" r="9" opacity="0.35" />
      <circle cx="12" cy="12" r="5.6" />
    </svg>
  )
}

function BeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9 sm:h-11 sm:w-11">
      <path d="M6.4 2.6h11.2v1.8h-1.5v12.4a4 4 0 0 1-4 4h-.2a4 4 0 0 1-4-4V4.4H6.4z" />
    </svg>
  )
}

function MaskIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9 sm:h-11 sm:w-11">
      <path d="M2.6 8.6c0-1.1.9-1.9 2-1.7l5.9 1.1c1 .2 2 .2 3 0l5.9-1.1c1.1-.2 2 .6 2 1.7v3.9c0 3.6-2.7 6.6-6.3 7l-1.3.2c-.9.1-1.8.1-2.7 0l-1.3-.2c-3.6-.4-6.3-3.4-6.3-7V8.6z" />
    </svg>
  )
}
