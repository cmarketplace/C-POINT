import { NextResponse } from "next/server";

import {
  fetchProductsByIds,
  fetchStorefrontPage,
  SemoFeedError,
  type StorefrontSort,
} from "@/lib/semo-feed";

const SORTS: StorefrontSort[] = ["recommended", "price_asc", "price_desc", "name"];

/**
 * 목록 조회 창구.
 *
 * **피드를 브라우저가 직접 부를 수는 없다** — 파트너 API 키는 서버 전용이고, 그 키는 이
 * 쇼핑몰만 쓰는 것도 아니다. 그래서 필터·정렬·페이지를 이 라우트가 받아 서버에서 대신 부른다.
 *
 * 상품이 18,000건이 된 뒤로 «전부 받아서 클라이언트가 거르기» 가 성립하지 않는다.
 * 걸러진 결과만 넘어오게 하는 것이 이 라우트의 존재 이유다.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  try {
    const ids = params.get("ids");
    if (ids) {
      // 북마크 모드: 목록이 아니라 «이 id 들» 이다.
      const items = await fetchProductsByIds(ids.split(",").filter(Boolean));
      return NextResponse.json({ items, total: items.length });
    }

    const sortParam = params.get("sort") as StorefrontSort | null;
    const page = await fetchStorefrontPage({
      q: params.get("q") ?? undefined,
      categoryId: params.get("categoryId") ?? undefined,
      rootCategoryId: params.get("rootCategoryId") ?? undefined,
      sort: sortParam && SORTS.includes(sortParam) ? sortParam : undefined,
      limit: Math.min(Number(params.get("limit")) || 120, 500),
      offset: Math.max(Number(params.get("offset")) || 0, 0),
    });

    return NextResponse.json(page);
  } catch (error) {
    // 피드 장애를 빈 목록으로 삼키면 화면에서 품절과 구분되지 않는다.
    const message =
      error instanceof SemoFeedError ? error.message : "상품을 불러오지 못했습니다";
    console.error("[shop/api]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
