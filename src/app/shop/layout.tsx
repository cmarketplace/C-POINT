import { SessionProvider } from "next-auth/react";

import { auth } from "@/auth";
import { IS_SSO_CONFIGURED } from "@/lib/shop-auth";

import { ShopProvider } from "../providers/ShopProvider";

/**
 * 쇼핑몰 공통 껍데기.
 *
 * 입장 판정은 여기가 아니라 `src/proxy.ts` 가 한다 — `/shop` 전 경로를 한 곳에서 막는다.
 * 이 레이아웃이 하는 일은 그 결과(세션)를 화면으로 내려보내는 것뿐이다.
 *
 * 세션을 **서버에서** 읽어 넘긴다. SessionProvider 에 값을 주지 않으면 클라이언트가
 * `/api/auth/session` 을 따로 왕복하고, 그동안 헤더의 사용자 이름이 비어 깜빡인다.
 *
 * SSO 설정이 없는 로컬에서는 `auth()` 를 부르지 않는다 — AUTH_SECRET 이 없으면 던지고,
 * 그러면 쇼핑몰 전 화면이 500 이 된다(게이트도 같은 이유로 로컬에서는 통과시킨다).
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = IS_SSO_CONFIGURED ? await auth() : null;

  return (
    <SessionProvider session={session}>
      <ShopProvider>{children}</ShopProvider>
    </SessionProvider>
  );
}
