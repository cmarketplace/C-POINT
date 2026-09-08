import Link from "next/link";

import { HERO_MEDIA } from "@/config/hero-media";

/** 가로 폭에 맞춰 비율이 바뀌는 영상 히어로. 영상 경로는 hero-media.ts에서 관리한다. */
export default function VideoHero() {
  const hasVideo = HERO_MEDIA.src.length > 0;

  return (
    <section className="w-full p-4 sm:p-6">
      <div className="bg-navy relative isolate flex aspect-[4/5] min-h-[440px] max-h-[760px] w-full items-center overflow-hidden rounded-lg sm:aspect-video lg:aspect-[21/9]">
        {/* 미디어 */}
        {hasVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_MEDIA.poster || undefined}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={HERO_MEDIA.src} type={HERO_MEDIA.type} />
          </video>
        ) : (
          <HeroMediaFallback />
        )}

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/25" />

        {/* 카피 — 카드 한가운데 */}
        <div className="relative flex w-full items-center justify-center py-12">
          <div className="container-content w-full px-6 text-center sm:px-10">
            <div className="mx-auto max-w-5xl">
              <h1 className="text-[28px] leading-[1.3] break-keep font-semibold tracking-tight text-white sm:text-[38px] lg:text-[48px]">
                일하는 모든 곳에 필요한 물품
                <br />
                최저가만 모아드려요
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.8] text-white/85 sm:text-base">
                승인된 상품만 모아 여러 공급 단가 중 최저가를 자동으로 적용합니다.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/shop/products"
                  className="bg-violet hover:bg-violet-strong flex h-12 items-center rounded-control px-7 text-sm font-semibold text-white transition-colors"
                >
                  상품 보러 가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 영상이 아직 없을 때 그 자리를 채우는 화면.
 *
 * 회색 상자를 두면 «아직 안 만든 자리» 로 보인다. 브랜드 그라데이션과 옅은 궤적으로
 * 채워, 영상이 들어오기 전에도 완성된 화면으로 서 있게 한다. 크기·비율은 영상과 같다.
 */
function HeroMediaFallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[linear-gradient(135deg,#1a1340_0%,#573ec9_46%,#7a63e0_100%)]"
      style={
        HERO_MEDIA.poster
          ? {
              backgroundImage: `url(${HERO_MEDIA.poster})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {!HERO_MEDIA.poster && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_78%_18%,rgba(0,200,240,0.42)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(55%_55%_at_12%_88%,rgba(87,62,201,0.5)_0%,transparent_72%)]" />

          <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full text-white"
          >
            <g fill="none" stroke="currentColor" strokeWidth="2" opacity="0.14">
              <rect x="-180" y="-260" width="700" height="700" rx="230" />
              <rect x="1120" y="-200" width="760" height="760" rx="260" />
              <rect x="300" y="560" width="980" height="700" rx="280" />
            </g>
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="12 16"
              opacity="0.2"
            >
              <path d="M0 190 H480" />
              <path d="M1060 130 H1600" />
              <path d="M0 760 H340" />
            </g>
          </svg>
        </>
      )}
    </div>
  );
}
