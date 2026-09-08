/**
 * 홈의 카테고리 카드 — **상품 사진은 이 파일에서만 갈아 끼운다.**
 *
 * `image` 에 경로를 넣으면 그 카드가 사진으로 바뀐다. 비어 있으면 같은 크기·같은 자리의
 * 빈 면이 그대로 서 있다 — 사진이 들어와도 카드 크기나 배치가 흔들리지 않게 하려는 것이다.
 * 없는 사진을 그림으로 지어내지 않는다.
 *
 * 파일은 배경이 없는(투명) PNG 로 `public/images/categories/` 에 둔다:
 *   office.png · snack.png · reagent.png · post.png · supplies.png
 */
export interface ShowcaseCategory {
  /** 카드 식별자 겸 파일 이름 */
  id: string
  /** 작은 라벨 */
  label: string
  /** 본문 두 줄 */
  lines: [string, string]
  /** 예: '/images/categories/office.png'. 비어 있으면 자리만 잡아 둔다. */
  image: string
}

export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  {
    id: 'office',
    label: '사무용품',
    lines: ['매일 쓰는 것부터', '제대로 채워두세요'],
    image: '/images/categories/office.png',
  },
  {
    id: 'snack',
    label: '간식',
    lines: ['잠깐의 휴식도', '넉넉하게 채워두세요'],
    image: '/images/categories/snack.png',
  },
  {
    id: 'reagent',
    label: '시약',
    lines: ['연구에 필요한 것', '여기서 바로'],
    image: '/images/categories/reagent.png',
  },
  {
    id: 'post',
    label: '우체국',
    lines: ['매일 쓰는 소모품', '빠짐없이'],
    image: '/images/categories/post.png',
  },
  {
    id: 'supplies',
    label: '용품',
    lines: ['현장에서 필요한 것까지', '한 번에'],
    image: '/images/categories/supplies.png',
  },
]
