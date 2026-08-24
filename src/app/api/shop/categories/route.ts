import { NextResponse } from "next/server";

import { fetchStorefrontCategories, SemoFeedError } from "@/lib/semo-feed";

/**
 * 카테고리 인덱스 창구.
 *
 * `/api/shop/items` 와 같은 이유로 존재한다 — 파트너 API 키는 서버 전용이라 브라우저가
 * 피드를 직접 부를 수 없다. 여기에 인덱스를 열어 두면 랜딩 숫자 스냅샷 갱신기
 * (`scripts/refresh-landing-stats.mjs`)도 키 없이 돌 수 있다.
 *
 * 세모에 이 경로가 아직 없으면 `groups: []` 를 돌려준다 — «없는 구간» 은 장애가 아니다.
 */
export async function GET() {
  try {
    const groups = await fetchStorefrontCategories();
    return NextResponse.json({ groups: groups ?? [] });
  } catch (error) {
    const message =
      error instanceof SemoFeedError ? error.message : "카테고리를 불러오지 못했습니다";
    console.error("[shop/api/categories]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
