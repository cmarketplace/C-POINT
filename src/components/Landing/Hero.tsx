import Link from 'next/link'
import HeroUiAnimation from './HeroUiAnimation'
import { RevealSection, RevealTitle } from './SectionReveal'

/**
 * 히어로 — 옅은 파랑 틴트 위의 미니멀 모노톤 히어로 + 실시간 인터랙티브 UI 애니메이션.
 *
 * 풀스크린(100vh) 스플릿 레이아웃:
 * 좌측: 기관 구매 가치 제안 및 명확한 핵심 CTA.
 * 우측: 9초 루프의 실시간 단가 검증 및 최저가 자동 적용 인터페이스 애니메이션.
 */
export default function Hero() {
  return (
    <RevealSection className="relative isolate flex min-h-screen items-center overflow-hidden py-16 lg:h-screen lg:min-h-[720px] lg:max-h-[960px] lg:py-0">
      <BackgroundTracks />

      {/* 카피 뒤 워시 — 배경 선이 글자에 닿기 전에 사라지게 한다. 배경 그라데이션의
        * 가장 옅은 색이라 면이 새로 생긴 것처럼 보이지 않는다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_46%_at_50%_42%,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.34)_52%,transparent_100%)] lg:bg-[radial-gradient(40%_58%_at_27%_50%,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0.38)_52%,transparent_100%)]"
      />

      <div className="relative mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-14">
          {/* 좌측 히어로 카피 & CTA */}
          <div className="flex flex-col items-center text-center lg:col-span-6 lg:items-start lg:text-left">
            <RevealTitle>
              {/* 첫 화면이 아니라 네 번째 섹션이다 — 크기는 다른 섹션 제목과 같은 단으로 둔다.
                * 여기만 크면 아래 「마지막 문」이 작아 보인다. */}
              <h1 className="text-navy text-[28px] leading-[1.32] font-semibold sm:text-[38px] lg:text-[40px]">
                기관 구매에 필요한 것만
                <br />
                <span className="keyword-gradient-glow">검증된 단가</span>로
              </h1>
            </RevealTitle>

            <p className="text-muted mx-auto mt-6 max-w-lg text-[15px] leading-[1.8] sm:text-[16px] lg:mx-0">
              승인된 상품만 모아 여러 공급 단가 중 최저가를 자동으로 적용합니다.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/shop/products"
                className="bg-violet hover:bg-violet-strong shadow-violet/25 flex h-13 items-center rounded-control px-8 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                상품 보러 가기
              </Link>
              <Link
                href="#contrast"
                className="text-violet ring-violet/30 flex h-13 items-center rounded-control bg-white/70 px-8 text-sm font-semibold ring-1 transition-colors hover:bg-white"
              >
                이용 방식
                <span aria-hidden="true" className="animate-scroll-hint ml-1.5 inline-block">
                  ↓
                </span>
              </Link>
            </div>
          </div>

          {/* 우측 11초 C-Market 최저가 로직 인터랙티브 UI 애니메이션 */}
          <div className="flex items-center justify-center lg:col-span-6 lg:justify-end">
            <HeroUiAnimation />
          </div>
        </div>
      </div>
    </RevealSection>
  )
}

/**
 * 배경 선 — 라운드 트랙 · 점선 · 원형 노드.
 *
 * 대비를 낮게 유지한다. 이 선들이 눈에 띄기 시작하면 타이틀이 진다.
 * `slice` 로 잘라내므로 화면 비율이 바뀌어도 선이 찌그러지지 않는다.
 *
 * 선과 노드는 화면 위·아래 여백으로 몰아 둔다. 가운데 띠(y 200~700)는 카피와 CTA 가
 * 앉는 자리라 비워 둔다 — 점선이 글자를 가로지르면 그 줄부터 읽는 속도가 떨어진다.
 * 비율에 따라 잘리는 위치가 달라지므로, 여기에 더해 카피 뒤에는 워시를 한 겹 깐다.
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
        <rect x="-160" y="-420" width="620" height="620" rx="200" />
        <rect x="1080" y="-300" width="700" height="700" rx="240" />
        <rect x="240" y="720" width="900" height="640" rx="260" />
        <rect x="1240" y="440" width="560" height="560" rx="190" />
      </g>

      <g fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="12 14" opacity="0.22">
        <path d="M0 150 H470" />
        <path d="M1010 170 H1600" />
        <path d="M0 800 H330" />
        <path d="M1120 780 H1600" />
      </g>

      {/* 배경 트랙 끝점 노드 — 4개 의미 아이콘 (체크, 쉴드, 카트, 번개) */}
      <g>
        <Node cx={470} cy={150}>
          <TickGlyph />
        </Node>
        <Node cx={1010} cy={170}>
          <ShieldGlyph />
        </Node>
        <Node cx={330} cy={800}>
          <CartGlyph />
        </Node>
        <Node cx={1120} cy={780}>
          <BoltGlyph />
        </Node>
      </g>
    </svg>
  )
}

/**
 * 노드 판.
 *
 * 원판은 **반투명**이라 뒤의 트랙 선이 비쳐 지나간다 — 흰 원으로 막으면 선이 노드에서
 * 끊긴 것처럼 보인다. 글리프는 `scale` 로 키우되 선 굵기는 배율로 나눠 두었다.
 * 크기만 커지고 선까지 굵어지면 배경이 타이틀과 경쟁하기 시작한다.
 */
const NODE_SCALE = 1.55

function Node({ cx, cy, children }: { cx: number; cy: number; children: React.ReactNode }) {
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${NODE_SCALE})`}>
      <circle
        r="20"
        fill="#ffffff"
        fillOpacity="0.5"
        stroke="#D3E2F0"
        strokeWidth={1.5 / NODE_SCALE}
      />
      <g
        fill="none"
        stroke="#707580"
        strokeWidth={1.8 / NODE_SCALE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </g>
  )
}

function TickGlyph() {
  return <path d="M-5 0.5 L-1.5 4 L6 -3.5" />
}

function ShieldGlyph() {
  return <path d="M0 -7 L6 -4 V1 C6 5.5 3 8 0 9.5 C-3 8 -6 5.5 -6 1 V-4 Z" />
}

function CartGlyph() {
  return (
    <>
      <path d="M-7 -5.5 H-5 L-3 2.5 H4.5 L6.5 -2.5 H-3.8" />
      <circle cx="-2.5" cy="5.5" r="1.3" fill="#707580" stroke="none" />
      <circle cx="3.8" cy="5.5" r="1.3" fill="#707580" stroke="none" />
    </>
  )
}

function BoltGlyph() {
  return <path d="M-6.5 1.5 H-1.5 L-3 7.5 L6.5 -1.5 H1.5 L3 -7.5 Z" />
}
