import CategoryStrip from '@/components/Landing/CategoryStrip'
import ClosingCTA from '@/components/Landing/ClosingCTA'
import Contrast from '@/components/Landing/Contrast'
import Evidence from '@/components/Landing/Evidence'
import LandingFooter from '@/components/Landing/LandingFooter'
import LandingHeader from '@/components/Landing/LandingHeader'
import ProcurementStats from '@/components/Landing/ProcurementStats'
import VideoHero from '@/components/Landing/VideoHero'
import Stats from '@/components/Landing/Stats'
import { getLandingStats } from '@/lib/landing-stats'

/**
 * 랜딩.
 *
 * 숫자는 저장소에 박아 둔 스냅샷에서 온다(`npm run landing:stats` 로 갱신). 랜딩은 빌드할
 * 때 피드를 부르지 않는다 — KCL 몰이 18,000건을 세다가 빌드가 죽었다.
 *
 * 지금 `c-point` 스토어프론트는 승인 품목이 0건이라 `getLandingStats()` 가 `null` 을 주고
 * 지표 섹션이 통째로 빠진다. 그 자리에 임시 숫자를 넣지 않은 것은 실수가 아니라 규칙이다 —
 * 씨마켓 디자인 시스템이 「근거 없는 최상급 표현」과 「실제 수치 없는 페이지」를 함께 금지한다.
 */
export default function LandingPage() {
  const stats = getLandingStats()

  return (
    <div className="landing-theme flex flex-1 flex-col">
      <LandingHeader />

      <main className="flex-1">
        <VideoHero />

        {/* 히어로와 2번 섹션 사이의 낮은 띠 — 몰의 갈래를 한 줄로 훑는다 */}
        <CategoryStrip />

        <Stats stats={stats} />

        <Evidence />

        <ProcurementStats />

        <Contrast />

        <ClosingCTA />
      </main>

      <LandingFooter />
    </div>
  )
}
