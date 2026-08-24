import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { IS_SSO_CONFIGURED, isAllowedGroup } from '@/lib/shop-auth'

/**
 * `/shop` 폐쇄몰 게이트 — KCL MRO 몰과 같은 문이다.
 *
 * 이 도메인이 직접 발급한 서명 세션(Auth.js JWT)을 검증하고, 소속 기관까지 확인한다.
 * 씨마켓 쿠키를 읽는 방식이 아니다 — 씨마켓과 이 몰은 다른 등록 도메인이라 그 쿠키가
 * 여기로 전송될 경로가 애초에 없다.
 */
const gate = auth((request) => {
  const session = request.auth

  if (!session?.user) {
    // 로그인 화면으로 보내고 원래 가려던 곳을 남긴다. authorize 로 직접 튕기지 않는 이유는
    // 씨마켓 세션이 없는 방문자가 영문 모르고 남의 로그인 화면을 보게 되기 때문이다.
    const loginUrl = new URL('/login', request.nextUrl.origin)
    loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (!isAllowedGroup(session.user.groupCode)) {
    // 씨마켓 로그인은 됐지만 이 몰의 기관 소속이 아니다 — 로그인 반복으로 몰지 않고 사유를 보여준다.
    return NextResponse.redirect(new URL('/login?error=not_allowed', request.nextUrl.origin))
  }

  return NextResponse.next()
})

/**
 * SSO 설정이 비어 있을 때의 처신이 환경마다 다르다.
 *
 * - **운영**: 문을 닫는다. 설정이 빠진 채 배포되면 폐쇄몰이 조용히 열려 있게 되는데,
 *   그게 이 몰에서 가장 피해야 하는 상태다. 로그인 화면이 사유를 밝힌다.
 * - **로컬**: 그대로 통과시킨다. 자격증명 없이도 화면을 볼 수 있어야 하고, `auth()` 는
 *   `AUTH_SECRET` 이 없으면 요청 자체를 던진다 — 그때 /shop 이 통째로 500 이 된다.
 */
export default function proxy(...args: Parameters<typeof gate>) {
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
  matcher: ['/shop/:path*'],
}
