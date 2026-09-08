import Link from 'next/link'
import { RevealCard, RevealSection, RevealTitle } from './SectionReveal'

/**
 * 마지막 문 — 디자인 시스템 §6① 「마지막 페이지 하단 그라데이션 워시」.
 *
 * 워시는 **하단에서 옅게** 올라온다. 화면 전체를 진한 파랑으로 채우는 것은 챕터 표지에서만
 * 허용된다(§2 피할 것). 여기는 본문의 끝이라 흰 바탕을 유지한다.
 */
export default function ClosingCTA() {
  return (
    <RevealSection className="relative overflow-hidden bg-white py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(70%_100%_at_50%_100%,var(--color-blue-tint-2)_0%,var(--color-blue-tint)_50%,transparent_100%)]"
      />

      <div className="container-content relative z-[2] px-5 text-center sm:px-10">
        <RevealTitle>
          <h2 className="text-text text-[28px] leading-[1.32] font-semibold sm:text-[38px] lg:text-[40px]">
            필요한 상품을
            <br />
            <span className="keyword-gradient-glow">C-Market Mall</span>에서 바로 찾아보세요
          </h2>
        </RevealTitle>

        <RevealCard>
          {/* 「가입 없이 열립니다」 같은 문장은 쓰지 않는다 — 지금은 맞지만 씨마켓 SSO 가
            * 붙는 순간 거짓이 되고, 랜딩은 그때 아무도 다시 안 읽는다. */}
          <p className="text-muted mt-6 text-[15px] leading-[1.8] sm:text-base">
            승인된 상품을 둘러보고 필요한 품목을 담아보세요.
          </p>

          <Link
            href="/shop/products"
            className="bg-violet hover:bg-violet-strong mt-9 inline-flex h-13 items-center rounded-control px-8 text-sm font-semibold text-white transition-colors"
          >
            상품 보러 가기
          </Link>
        </RevealCard>
      </div>
    </RevealSection>
  )
}
