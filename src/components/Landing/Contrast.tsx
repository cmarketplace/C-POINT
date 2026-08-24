/**
 * AS-IS / TO-BE — 디자인 시스템 §5 「E. 좌우 대비형」.
 *
 * 「회색(불편한 현재) ↔ 파랑·민트(개선된 미래)라는 구도가 문서 전체를 관통한다」(§2).
 * 왼쪽은 Neutral Fill 회색, 오른쪽은 Blue Tint. 각 열 상단에 pill 라벨(§6③)을 달고
 * 사이를 점선으로 잇는다.
 *
 * TO-BE 세 줄은 **오늘 이미 성립하는 것**만 적었다. 「주문서가 자동으로 만들어진다」 같은
 * 문장은 세모로 주문을 넘기는 경로가 아직 없어서 넣지 않았다 — 랜딩이 약속한 것을
 * 장바구니가 「준비 중」이라고 되받으면 그 순간 나머지 문장도 못 믿게 된다.
 */

const ROWS: { asIs: string; toBe: string }[] = [
  {
    asIs: '품목마다 공급사를 찾고 견적을 따로 받는다',
    toBe: '승인된 공급사 조합만 목록에 올라온다',
  },
  {
    asIs: '같은 물건인데 어디서 사느냐에 따라 값이 다르다',
    toBe: '여러 곳이 대면 늘 그중 가장 싼 값으로 담긴다',
  },
  {
    asIs: '어느 업체와 얼마에 거래하는지가 사람마다 다르게 남는다',
    toBe: '공급처는 드러나지 않고 값만 비교된다',
  },
]

export default function Contrast() {
  return (
    <section id="contrast" className="bg-blue-tint py-20 sm:py-28">
      <div className="container-content px-5 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-text text-[28px] leading-[1.32] font-semibold sm:text-[40px]">
            같은 물건을 사는데,
            <br />
            <span className="text-primary">과정만</span> 달라집니다
          </h2>

          <p className="text-muted mt-6 text-[15px] leading-[1.8] sm:text-base">
            바꾸는 것은 무엇을 사느냐가 아니라 고르는 방식입니다.
          </p>
        </div>

        <div className="relative mx-auto mt-14 grid max-w-4xl gap-4 lg:grid-cols-2 lg:gap-14">
          {/* 시그니처 ② 두 열 사이를 잇는 점선. 넓은 화면에서만. */}
          <div
            aria-hidden="true"
            className="border-accent-dark pointer-events-none absolute inset-y-10 left-1/2 hidden -translate-x-1/2 border-l border-dashed lg:block"
          />

          {/* AS-IS */}
          <div className="rounded-lg bg-white p-7 sm:p-8">
            <span className="bg-bg-secondary text-muted-strong inline-flex rounded-full px-3 py-1 text-xs font-semibold">
              AS-IS
            </span>

            <ul className="mt-6 space-y-4">
              {ROWS.map(row => (
                <li key={row.asIs} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="bg-bg-secondary mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  />
                  <p className="text-muted text-sm leading-[1.7]">{row.asIs}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* TO-BE */}
          <div className="rounded-lg bg-white p-7 sm:p-8">
            <span className="bg-primary inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white">
              TO-BE
            </span>

            <ul className="mt-6 space-y-4">
              {ROWS.map(row => (
                <li key={row.toBe} className="flex gap-3">
                  {/* 민트는 성공·완료의 색이다(§3). 글자가 아니라 표시에만 쓴다. */}
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0">
                    <circle cx="8" cy="8" r="8" className="fill-highlight" />
                    <path
                      d="m4.6 8.2 2.2 2.2 4.6-4.6"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="text-text text-sm leading-[1.7] font-medium">{row.toBe}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
