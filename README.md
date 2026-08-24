# C-POINT

씨마켓 C-POINT 쇼핑몰. 상품은 **세모(SEMO) 큐레이션 피드**에서 온다 —
세모 마스터가 「이 쇼핑몰 × 품목 × 공급사」로 승인한 것만 내려온다.

KCL MRO → FITI MRO 로 이어진 몰의 세 번째다. 화면 구조와 데이터 경로는 같고,
기관 종속값만 `src/config/tenant.ts` 와 `globals.css` 의 브랜드 색으로 갈라진다.

## 실행

```bash
npm install
cp .env.example .env.local   # SEMO_API_KEY 를 채운다
npm run dev
```

## 지금 있는 화면

| 경로 | 화면 |
| --- | --- |
| `/` | 랜딩 — 히어로 · 지표 · 근거 3칸 · AS-IS/TO-BE · 마무리 CTA |
| `/shop` | 상품 목록 — 대분류/소분류·검색·정렬·찜·더 보기 |
| `/shop/[productId]` | 상품 상세 — 규격표·상품 설명·배송 안내·익명 단가 비교·추천 |
| `/shop/cart` | 장바구니 — 선택·수량·합계·추천 캐러셀 |

## 구조

```
세모 백엔드  GET /external/storefronts/{slug}/items        ← X-API-Key (서버 전용)
                 /external/storefronts/{slug}/categories
                 /external/storefronts/{slug}/items/{id}
                 /external/storefronts/{slug}/items/{id}/offers
        │
  src/lib/semo-feed.ts        세모와 닿는 유일한 파일
        │
  ├── 서버 컴포넌트가 직접 호출  (app/shop/page.tsx, app/shop/[productId]/page.tsx,
  │                              app/shop/cart/page.tsx)
  └── /api/shop/items · /api/shop/categories   브라우저용 창구
        │
  components/Shop/Shop.tsx    분류·검색·정렬·페이지 상태
  lib/cart.ts · lib/bookmarks.ts   장바구니·찜 (localStorage 외부 스토어)
```

지켜야 하는 두 가지:

1. **파트너 키는 브라우저로 내보내지 않는다.** 그 키는 이 몰 전용이 아니라 씨마켓 연동
   전체가 쓰는 키다. `NEXT_PUBLIC_` 을 붙이지 말고, 브라우저는 `/api/shop/*` 만 부른다.
2. **필터·정렬·페이징은 서버가 한다.** 카탈로그가 만 단위가 되면 «전부 받아서 브라우저가
   거르기» 는 성립하지 않는다.

## 지금 상태에서 알아 둘 것

- **세모에 `c-point` 스토어프론트는 등록되어 있지만 승인 품목이 0건이다**
  (2026-08-24 확인). 그래서 목록은 「아직 등록된 상품이 없습니다」로 뜬다 — 피드 장애와는
  다른 화면이다(장애면 「불러오지 못했습니다」). 세모에서 품목을 승인해 주면 그대로 채워진다.
  화면을 데이터가 있는 상태로 확인하려면 `.env.local` 의 `STOREFRONT_SLUG` 를 잠깐
  `kclmro` 로 바꿔 띄운다.
- **몰 이름·운영 주체 표기는 임시값이다.** `src/config/tenant.ts` 한 곳에 모여 있으니
  확정되면 그 파일만 고친다.
- **로고는 씨마켓 로고를 그대로 쓴다**(`public/images/cmarket-logo.png`).
  C-POINT 전용 마크가 나오면 그 파일과 `ShopNav.tsx` 만 갈아 끼운다.

## 랜딩의 숫자

랜딩의 「N품목 · N대분류 · N소분류」는 빌드할 때 세지 않는다. `src/data/landing-stats.json`
스냅샷을 읽을 뿐이고, 갱신은 사람이 돌린다.

```bash
npm run landing:stats -- --base http://localhost:3000   # 띄워 둔 몰에서 세어 파일을 덮어쓴다
npm run landing:stats -- --dry                          # 세기만 한다
```

품목이 0건이면 `getLandingStats()` 가 `null` 을 주고 **지표 섹션이 통째로 빠진다.**
「0품목」을 그리면 «상품이 없는 몰» 로 읽히고, 임시 숫자를 채워 넣는 것은 씨마켓
디자인 시스템이 가장 강하게 금지하는 것이다(§2 「근거 없는 최상급 표현」).

랜딩의 디자인 규칙은 `~/Desktop/씨마켓_디자인_시스템.md` 를 따른다 — 타이틀 2줄,
핵심어만 파랑, 수치와 단위 분리, 수치 옆 기준일, AS-IS/TO-BE 대비, 장식용 영문 카피 금지.

## 아직 없는 것

- **로그인** — 씨마켓 SSO 를 붙이려면 C-POINT 에 입장할 기관 그룹(씨마켓 `group_code`)과
  테넌트 authorize 호스트가 먼저 정해져야 한다. 지금은 `/shop` 이 열려 있다.
- **주문 접수** — 장바구니까지만 있다. 세모로 주문/공고를 넘기는 경로가 없어서 장바구니
  요약에는 버튼 대신 안내가 서 있다 — 눌리는 것처럼 보이면 접수된 줄 안다.
- **분류 접기** — 뎁스1 은 세모 최상단을 그대로 쓴다. C-POINT 품목이 채워지고
  「이 몰의 언어」가 정해지면 그때 매핑 층을 `Shop.tsx` 에 끼운다.
