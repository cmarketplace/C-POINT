import HeroUiAnimation from './HeroUiAnimation'
import { RevealCard, RevealSection, RevealTitle } from './SectionReveal'

/**
 * 지표 + 구매 화면 — 왼쪽은 숫자, 오른쪽은 그 숫자가 실제로 어떻게 굴러가는지 보여 주는
 * 화면(`HeroUiAnimation`)이다. 「최저가 비교」라고 적어 놓고 그 옆에서 실제로 최저가가
 * 붙는 장면이 돌아가는 편이, 문장 하나를 더 얹는 것보다 빠르게 읽힌다.
 *
 */
const METRICS = [
  {
    value: '40,000',
    suffix: '+',
    label: '승인 공급사',
    caption: '검증된 공급 네트워크',
  },
  {
    value: '자동',
    label: '최저가 비교',
    caption: '승인 공급사 단가 자동 비교',
  },
  {
    value: '100',
    suffix: '%',
    label: '후불결제 지원',
    caption: '기관 구매 방식에 맞게',
  },
]

export default function ProcurementStats() {
  return (
    <RevealSection className="bg-white py-16 sm:py-20">
      <div className="container-content px-5 sm:px-10">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:gap-16">
          {/* 왼쪽 — 제목과 숫자. 오른쪽에 화면이 서므로 가운데가 아니라 왼쪽으로 붙인다. */}
          <div>
            <RevealTitle>
              <h2 className="text-text text-center text-[28px] leading-[1.32] font-semibold sm:text-[38px] lg:text-left lg:text-[40px]">
                구매는 간단하게
                <br />
                기준은 더 확실하게
              </h2>
            </RevealTitle>

            <RevealCard className="mt-10 sm:mt-12">
              {/* 칸 사이는 얇은 세로선 하나로만 나눈다 — 상자를 두르면 «카드» 가 되고,
                * 그러면 숫자보다 상자가 먼저 보인다. */}
              <dl className="divide-border grid gap-8 sm:grid-cols-3 sm:gap-0 sm:divide-x">
                {METRICS.map((metric, index) => (
                  <div
                    key={metric.label}
                    className={`text-center sm:text-left ${
                      index === 0 ? 'sm:pr-3' : index === METRICS.length - 1 ? 'sm:pl-3' : 'sm:px-3'
                    }`}
                  >
                    {/* 세 줄의 높이를 칸마다 고정한다 — 설명이 한 줄인 칸과 두 줄인 칸이
                      * 섞이면 숫자·라벨은 맞아도 아래쪽이 어긋나 보인다. */}
                    <dd className="text-primary flex h-9 items-baseline justify-center gap-0.5 whitespace-nowrap text-[32px] leading-none font-semibold tabular-nums sm:h-10 sm:justify-start sm:text-[32px]">
                      {metric.value}
                      {metric.suffix && <span className="text-[0.6em]">{metric.suffix}</span>}
                    </dd>

                    <dt className="text-text mt-3.5 flex h-6 items-center justify-center text-[15px] font-semibold sm:justify-start">
                      {metric.label}
                    </dt>

                    <p className="text-muted mt-1.5 min-h-10 text-[12.5px] leading-[1.6]">
                      {metric.caption}
                    </p>
                  </div>
                ))}
              </dl>
            </RevealCard>
          </div>

          {/* 오른쪽 — 구매 화면 그대로. 안쪽 연출은 손대지 않았다. */}
          <RevealCard className="flex justify-center lg:justify-end">
            <HeroUiAnimation />
          </RevealCard>
        </div>
      </div>
    </RevealSection>
  )
}
