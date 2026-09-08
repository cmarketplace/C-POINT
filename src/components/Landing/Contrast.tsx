/**
 * AS-IS / TO-BE — 디자인 시스템 §5 「E. 좌우 대비형」을 **비대칭**으로 변주했다.
 *
 * 「회색(불편한 현재) ↔ 파랑·민트(개선된 미래)라는 구도가 문서 전체를 관통한다」(§2).
 * 다만 두 열을 같은 크기로 두면 «지금 이대로도 그럭저럭 된다»로 읽힌다. 그래서
 * AS-IS 는 32%, TO-BE 는 68%로 두고 사이를 점선으로 잇는다(시그니처 ②).
 * 시선은 AS-IS 의 흩어진 견적서 → TO-BE 비교 화면 → 민트색 최저가 → 파란 장바구니
 * 순서로 한 번에 떨어져야 한다.
 *
 * TO-BE 세 장(제목·설명·픽토그램)은 `ContrastFlowAnimation` 안에 한 벌로 모아 두었다.
 * 거기 적힌 것은 **오늘 이미 성립하는 것**만이다 — 최저가 적용, 세모 대행판매,
 * 후불결제. 랜딩이 약속한 것을 장바구니가 「준비 중」이라고 되받으면 그 순간
 * 나머지 문장도 못 믿게 된다.
 */

import ContrastFlowAnimation from './ContrastFlowAnimation'
import { RevealCard, RevealSection, RevealTitle } from './SectionReveal'

const AS_IS_ROWS = [
  '품목마다 공급사를 찾고 견적을 따로 받는다',
  '같은 물건인데 어디서 사느냐에 따라 값이 다르다',
  '어느 업체와 얼마에 거래하는지가 사람마다 다르게 남는다',
]

export default function Contrast() {
  return (
    <RevealSection id="contrast" className="relative bg-white py-16 sm:py-20">
        <div className="container-content relative z-[2] w-full px-5 sm:px-10">
          <RevealTitle className="mx-auto max-w-3xl text-center">
            <h2 className="text-text text-[28px] leading-[1.32] font-semibold sm:text-[38px] lg:text-[40px]">
              비교부터 결제까지
              <br />
              기관 구매에 맞게 <span className="keyword-gradient-glow">간편하게</span>
            </h2>

            <p className="text-muted mt-6 text-[15px] leading-[1.8] sm:text-base">
              바꾸는 것은 무엇을 사느냐가 아니라 고르는 방식입니다.
            </p>
          </RevealTitle>

          <RevealCard>
            <ContrastFlowAnimation asIsRows={AS_IS_ROWS} />
          </RevealCard>
        </div>
    </RevealSection>
  )
}
