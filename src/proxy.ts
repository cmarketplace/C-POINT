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
