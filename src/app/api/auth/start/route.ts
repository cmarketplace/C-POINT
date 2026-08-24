import { signIn } from '@/auth'
import { safeNextPath } from '@/lib/shop-auth'

/**
 * 씨마켓 SSO 자동 시작 — «본진에 로그인해 있으면 클릭 없이 그대로 입장» 을 만드는 자리.
 *
 * `proxy.ts` 가 세션 없는 `/shop` 접근을 여기로 보낸다. 여기서 곧장 authorize 로 넘기므로
 * 씨마켓 세션이 살아 있는 사람에겐 **화면 전환 한 번**으로 끝난다(로그인 버튼을 누르는 단계가
 * 없다). 세션이 없으면 씨마켓 로그인 화면이 뜨고, 로그인하면 이 흐름으로 자동 복귀한다.
 *
 * **왜 서버 액션이 아니라 Route Handler 인가:** 리다이렉트로 도착하는 자리라 GET 이어야 한다.
 * `signIn()` 은 PKCE·state 쿠키를 심어야 하는데 쿠키 쓰기는 서버 액션과 Route Handler 에서만
 * 되고, 서버 컴포넌트에서는 안 된다 — 그래서 `/login` 페이지가 대신 할 수 없다.
 *
 * `/api/auth/*` 는 게이트 matcher 밖이다. 안이면 이 경로가 자기 자신으로 리다이렉트한다.
 */
export async function GET(request: Request) {
  const next = new URL(request.url).searchParams.get('next')
  // signIn() 은 redirect() 를 던진다 — Next 가 그것을 302 로 바꾼다. 반환값이 없는 게 정상이다.
  await signIn('cmarket', { redirectTo: safeNextPath(next) })
}
