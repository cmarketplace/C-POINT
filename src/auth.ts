import NextAuth from 'next-auth'

import type { NextAuthConfig } from 'next-auth'

/**
 * 씨마켓 SSO — 이 몰의 유일한 인증 경로.
 *
 * 프로토콜은 OAuth 2.0 authorization_code + PKCE(S256). 씨마켓은 OIDC(`id_token`/JWKS/
 * discovery)를 제공하지 않으므로 generic `oauth` provider 로 `token`·`userinfo` 를 직접 가리킨다.
 *
 * **쿠키 공유가 아니다.** 씨마켓은 `c-market.kr`, 이 몰은 자기 도메인 — 별도 등록 도메인이라
 * 씨마켓 세션 쿠키가 여기로 전송될 길이 없다(3rd-party 쿠키 차단과 무관하게 애초에 다른
 * 사이트다). 대신 top-level 리다이렉트로 신원을 받아 **이 도메인의 first-party 세션 쿠키**를
 * 새로 발급한다.
 *
 * KCL MRO 몰이 쓰는 것과 같은 설정이다. 갈라지는 것은 `.env` 셋뿐이다 —
 * authorize 호스트(테넌트), client 자격증명, 입장 그룹 코드(`src/lib/shop-auth.ts`).
 */

/** 씨마켓 `/oauth/userinfo` 응답. */
interface CmarketProfile {
  /** `role:groupCode:memberId` 복합키. 씨마켓에 회원·직원 두 원장이 있어 단일 id 를 못 쓴다. */
  sub: string
  role: 'BUYER' | 'SUPPLIER' | 'EMPLOYEE'
  memberId: string
  groupCode: number
  name: string | null
  email: string | null
  department: string | null
  position: string | null
  companyMemberId: string | null
}

/**
 * authorize 는 반드시 **테넌트 호스트**여야 한다 — 로그인 화면이 기관 브랜딩으로 뜨고,
 * 씨마켓 로그인이 host 로 소속 기관을 판정한다. 본진 호스트로 보내면 둘 다 어긋난다.
 *
 * 기본값을 두지 않는다. C-POINT 의 테넌트 호스트는 아직 정해지지 않았고, 남의 몰 호스트를
 * 기본값으로 박아 두면 «로그인은 되는데 남의 기관 화면» 이 된다.
 */
const CMARKET_AUTHORIZE_URL = process.env.CMARKET_AUTHORIZE_URL?.trim() ?? ''

/**
 * 씨마켓 **파트너 API** 의 운영 호스트.
 *
 * 토큰 교환과 신원 조회는 여기다 — `app-api.c-market.net/sso/token` 이 아니다. 씨마켓이 그
 * 표면을 파트너 API 로 옮겼고, 자격증명도 파트너 키 한 벌로 합쳐졌다. 옛 경로는 이제 씨마켓
 * 내부 전용이라 몰의 자격증명으로는 `client 인증에 실패했습니다`(401) 만 돌아온다 —
 * 2026-08-24 에 KCL 몰 로그인이 통째로 막혀 있던 원인이 정확히 이것이었다.
 *
 * `api.c-market.net` 도 아니다. 그 호스트는 V5 Java 어댑터가 앞단이라 404 로 떨어진다
 * (응답 본문이 Spring 형식 `{timestamp,status,error,path}` 인 것으로 구분된다).
 */
const CMARKET_API_BASE = process.env.CMARKET_API_BASE?.trim() || 'https://partner-api.c-market.net'

export const authConfig: NextAuthConfig = {
  /**
   * 세션 1시간 — 씨마켓 쪽 정지·탈퇴·그룹 이탈이 몰에 전파되는 상한이다.
   * 씨마켓은 back-channel logout 웹훅을 제공하지 않는다. 대신 만료 후 다음 접근에서
   * authorize 를 다시 타고, 그 시점에 씨마켓이 원장을 재조회해 자격을 다시 판정한다.
   * 씨마켓 세션이 살아 있으면 사용자에겐 화면 전환으로만 보인다.
   */
  session: { strategy: 'jwt', maxAge: 60 * 60 },
  trustHost: true,
  pages: { signIn: '/login' },
  providers: [
    {
      id: 'cmarket',
      name: '씨마켓',
      type: 'oauth',
      // 씨마켓 어드민이 발급한 파트너 키. 이 키에 `sso:login` 스코프와 아래 콜백 주소가
      // 등록되어 있어야 한다 — 없으면 교환이 `unauthorized_client` 로 떨어진다.
      clientId: process.env.CMARKET_CLIENT_ID,
      clientSecret: process.env.CMARKET_CLIENT_SECRET,
      // PKCE 는 씨마켓이 S256 만 받는다. state 는 CSRF 방지로 함께 건다.
      checks: ['pkce', 'state'],
      authorization: { url: CMARKET_AUTHORIZE_URL },
      // 파트너 API 를 부를 때 쓰는 것과 **같은 엔드포인트**다 — grant_type 만 다르다
      // (API 호출은 client_credentials, 로그인은 authorization_code).
      token: `${CMARKET_API_BASE}/oauth/token`,
      userinfo: `${CMARKET_API_BASE}/oauth/userinfo`,
      profile(profile: CmarketProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          memberId: profile.memberId,
          groupCode: profile.groupCode,
          department: profile.department,
          position: profile.position,
          companyMemberId: profile.companyMemberId,
        }
      },
    },
  ],
  callbacks: {
    // 씨마켓 신원 축을 세션까지 끌고 간다 — 주문 화면이 "누가" 사는지 알아야 한다.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.memberId = user.memberId
        token.groupCode = user.groupCode
        token.department = user.department
        token.position = user.position
        token.companyMemberId = user.companyMemberId
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role
      session.user.memberId = token.memberId
      session.user.groupCode = token.groupCode
      session.user.department = token.department
      session.user.position = token.position
      session.user.companyMemberId = token.companyMemberId
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
