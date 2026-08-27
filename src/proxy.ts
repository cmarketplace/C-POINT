import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { IS_SSO_CONFIGURED, isAllowedGroup } from '@/lib/shop-auth'

/**
 * «모두 개방» 몰의 문 — 지키는 것은 **내 기록 화면뿐이다** (확정 결정 2026-08-25).
 *
 * 열람(목록·상세·장바구니)은 로그인 없이 공개라 matcher 자체가 그 경로를 보지 않는다.
 * 주문 내역·영수증은 «누구의 기록인가» 없이는 그릴 수 없어 세션을 요구한다 — 주문 API
 * (`/api/shop/orders`)는 이 게이트와 별개로 스스로 401 을 낸다(문이 둘이어야, 한쪽
 * 설정이 넓어져도 남의 주문이 새지 않는다).
 *
 * 세션 검증은 이 도메인이 직접 발급한 서명 세션(Auth.js JWT)이다. 씨마켓 쿠키를 읽는
 * 방식이 아니다 — 씨마켓과 이 몰은 다른 등록 도메인이라 그 쿠키가 여기로 전송될 경로가
 * 애초에 없다.
 */
const gate = auth((request) => {
  const session = request.auth

  if (!session?.user) {
    // **로그인 화면을 거치지 않고** 곧장 씨마켓으로 보낸다 — 본진에 로그인해 있는 사람은
    // 버튼을 누르는 단계 없이 화면 전환만으로 들어와야 한다는 것이 이 몰의 요구다.
    // (KCL 몰은 반대로 `/login` 을 한 번 세운다. 그쪽은 단일 기관 폐쇄몰이라 «남의 로그인
    //  화면이 영문 모르고 뜨는» 쪽을 더 무겁게 봤다. 이 몰은 씨마켓 회원만 오는 곳이다.)
    const startUrl = new URL('/api/auth/start', request.nextUrl.origin)
    startUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(startUrl)
  }

  if (!isAllowedGroup(session.user.groupCode)) {
    // 씨마켓은 열어 줬는데 이 몰이 `CMARKET_GROUP_CODES` 로 더 좁혀 둔 경우다(선택값).
    // 로그인 반복으로 몰지 않고 사유를 보여준다.
    return NextResponse.redirect(new URL('/login?error=not_allowed', request.nextUrl.origin))
  }

  return NextResponse.next()
})

/**
 * SSO 설정이 비어 있을 때의 처신.
 *
 * - **데모 신원(SHOP_DEMO_MEMBER)이 켜져 있으면** 통과 — 파트너 키 발급 전에 주문
 *   화면을 눌러 보는 임시 통로다(`shop-member.ts`). 운영 환경변수에는 절대 넣지 않는다.
 * - **운영**: 내 기록 화면만 닫는다(열람은 애초에 matcher 밖이라 계속 열려 있다).
 * - **로컬**: 통과 — `auth()` 는 AUTH_SECRET 없이는 요청 자체를 던져 화면이 500 이 된다.
 */
export default function proxy(...args: Parameters<typeof gate>) {
  // 데모 신원 — 문을 연다. «누가» 는 shop-member.ts 가 채우고, 실세션이 있으면
  // 언제나 실세션이 이긴다.
  if (process.env.SHOP_DEMO_MEMBER?.trim()) {
    return NextResponse.next()
  }

  if (!IS_SSO_CONFIGURED) {
    const [request] = args
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/login?error=not_configured', request.nextUrl.origin))
    }
    return NextResponse.next()
  }

  return gate(...args)
}

export const config = {
  // 열람은 공개다 — /shop 전체가 아니라 «내 기록» 두 화면만 지킨다(shop-auth.ts 의
  // SHOP_PROTECTED_PATHS 와 같은 범위. matcher 는 정적 문자열만 받아 여기 다시 적는다).
  matcher: ['/shop/orders/:path*', '/shop/order-complete'],
}
