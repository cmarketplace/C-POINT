import snapshot from '@/data/landing-stats.json'

/**
 * 랜딩이 쓰는 실측 숫자 — **스냅샷**이다.
 *
 * 랜딩이 그릴 때마다 피드를 세지 않는다. KCL 몰이 그렇게 했다가 승인 품목이 18,000건이
 * 된 뒤로 정적 생성 워커 한도(60초)를 넘겨 운영 배포가 통째로 실패했다. 이 숫자들은
 * 한 달에 한 번꼴로 움직이므로 `scripts/refresh-landing-stats.mjs` 로 미리 세어
 * `src/data/landing-stats.json` 에 박아 두고, 여기서는 그 파일만 읽는다 —
 * **네트워크를 타지 않는다.** 피드가 죽어 있어도 랜딩은 그대로 선다.
 *
 * 갱신: `npm run landing:stats`
 */
export interface LandingStats {
  /** 이 숫자들을 잰 날(YYYY-MM-DD). 화면에 「기준일」로 그대로 나간다 —
   * 디자인 시스템 §7 「수치 옆에는 반드시 출처·기준일을 작게 붙인다」. */
  measuredAt: string
  /** 어디서 잰 값인가. 화면에는 안 나가고 사람이 diff 를 읽을 때 쓴다. */
  source: string
  /** 이 쇼핑몰에 승인된 전체 품목 수 */
  itemCount: number
  /** 품목이 걸쳐 있는 소분류 수 */
  categoryCount: number
  /** 세모 최상단 분류(대분류) 수 */
  rootCount: number
  /** 대분류명 → 품목 수 */
  countsByRoot: Record<string, number>
}

/**
 * 스냅샷을 읽는다. 아직 안 채워졌으면(`itemCount` 0) `null` 을 준다 —
 * 호출부는 숫자 블록을 통째로 **비운다**.
 *
 * 0 을 그리지 않는 이유가 둘이다. 화면에서 「0품목」은 «상품이 없는 몰» 로 읽히고,
 * 디자인 시스템 §8 이 「주장을 뒷받침할 실제 수치가 없으면 그 페이지는 성립하지 않는다」고
 * 못박아 두었다 — 근거가 없으면 그 블록을 세우지 않는 것이 규칙에 맞는 처리다.
 */
export function getLandingStats(): LandingStats | null {
  const stats = snapshot as LandingStats
  if (!stats || stats.itemCount <= 0) return null
  return stats
}
