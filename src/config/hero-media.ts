/**
 * 첫 화면 영상 — **이 파일 한 곳만 갈아 끼우면 된다.**
 *
 * 최종 영상이 나오면 `src` 에 경로를 넣는다(`public/videos/...`). 그때까지는 `src` 가
 * 비어 있고, 히어로는 같은 자리·같은 비율의 브랜드 화면을 대신 그린다 — 임시 상자처럼
 * 보이지 않게 하려는 것이고, 영상이 들어와도 레이아웃이 흔들리지 않는다.
 */
export const HERO_MEDIA = {
  /** 예: '/videos/hero.mp4' */
  src: '/videos/hero.mp4',
  /** 영상 첫 프레임 대체 이미지. 예: '/images/hero-poster.jpg' */
  poster: '',
  type: 'video/mp4',
} as const
