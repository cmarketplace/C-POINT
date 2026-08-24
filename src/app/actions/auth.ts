'use server'

import { signIn, signOut } from '@/auth'

/**
 * 씨마켓 SSO 로그인 시작.
 *
 * 폼에서 `/api/auth/signin/cmarket` 로 직접 POST 하지 않는 이유: Auth.js 는 그 엔드포인트에
 * CSRF 토큰을 요구한다. 서버 액션은 Next 가 자체 보호를 걸어 주므로 토큰을 손으로 실어 나를
 * 필요가 없다(클라이언트 컴포넌트에서도 import 해 `<form action={...}>` 에 그대로 쓴다).
 */
export async function signInWithCmarket(formData?: FormData) {
  const redirectTo = formData?.get('redirectTo')
  await signIn('cmarket', {
    redirectTo: typeof redirectTo === 'string' && redirectTo.startsWith('/') ? redirectTo : '/shop',
  })
}

/** 몰 세션만 끊는다 — 씨마켓 세션은 그대로다(그쪽 로그아웃은 씨마켓에서 한다). */
export async function signOutFromShop() {
  await signOut({ redirectTo: '/' })
}
