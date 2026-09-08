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
  /**
   * 실패의 **진짜 사유는 여기에만 남는다.**
   *
   * 화면은 사유를 두 갈래로만 가른다 — Auth.js 가 client-safe 8종 외의 오류를 통째로
   * `Configuration` 으로 뭉개 클라이언트에 사유를 흘리지 않기 때문이다. 그런데 기본 로거는
   * 원인(`cause`)을 찍지 않아 서버 쪽에도 남는 것이 없다. 「로그를 보라」고 적어 두고 로그가
   * 비어 있으면 그 주석은 거짓말이다.
   *
   * `cause` 에 토큰 엔드포인트 응답 본문이 들어 있다 — 연동에서 막히는 자리는 거의 항상
   * 거기다(콜백 미등록·스코프 없음·DPoP 키).
   */
  logger: {
    error(error) {
      const cause = (error as Error & { cause?: unknown }).cause
      console.error('[auth]', error.name, '-', error.message)
      if (cause) console.error('[auth] cause:', JSON.stringify(cause, null, 2).slice(0, 2000))
    },
  },
  /**
   * 실패도 이 몰의 화면에서 끝낸다.
   *
   * `error` 를 비워 두면 Auth.js 내장 페이지가 **HTTP 500 + 영문**으로 뜬다
   * ("There is a problem with the server configuration"). 몰 디자인도 재시도 경로도 없어서
   * 사용자가 뒤로가기로 콜백 URL 을 재생하고, 그건 1회용 state 쿠키가 이미 지워진 뒤라
   * 또 실패한다 — KCL 몰 2026-08 실측에서 실패 콜백 42건 중 37건이 그 재생이었다.
   */
  pages: { signIn: '/login', error: '/login' },
  providers: [
    {
      id: 'cmarket',
      name: '씨마켓',
      type: 'oauth',
      /**
       * 씨마켓 어드민이 발급한 **SSO 전용** 키.
       *
       * 세 가지가 동시에 맞아야 로그인이 열린다. 하나라도 어긋나면 교환 단계에서 죽고,
       * 화면에는 사유가 안 나온다.
       *
       * 1. 스코프가 `sso:login` **단독**이어야 한다. 씨마켓은 모든 파트너 키에
       *    「허용 IP 또는 DPoP 중 최소 하나」를 요구하는데, SSO 전용 키만 그 불변식에서
       *    면제된다(`isSsoLoginOnlyScopes`). ERP 스코프를 얹으면 그 면제가 사라진다.
       * 2. **허용 IP 를 비워야 한다.** 이 몰은 Vercel 서버리스라 발신 IP 가 고정되지 않는다.
       *    목록이 있으면 절대 일치하지 않아 토큰 교환이 영구 401 이다
       *    (`invalid_client / client IP not allowed`).
       * 3. **DPoP 를 꺼야 한다.** 씨마켓은 DPoP 로 묶인 키의 authorization_code 교환을
       *    거절한다 — 그 grant 가 내보내는 토큰은 backend 가 만든 SSO 토큰이라 `cnf`(jkt)를
       *    실을 자리가 없다. KCL 몰이 2026-09-01 에 이걸로 하루를 날렸다
       *    (`unauthorized_client`).
       *
       * 서버 간 호출(client_credentials)용 키가 나중에 필요해지면 **다른 키로** 발급한다.
       * 그쪽은 DPoP 를 켜는 것이 맞고, 한 벌로 겸할 수 없다.
       *
       * 콜백 주소도 이 키에 정확일치로 등록되어 있어야 한다.
       */
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
        // `token.sub` 는 Auth.js 가 `user.id`(=씨마켓 `sub`)로 이미 채운다. 그 값이 몰의
        // **전역 유일 키**다 — 아래 session 콜백이 그대로 옮긴다.
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
      // 씨마켓 `sub`(`role:groupCode:memberId`). **주문·견적의 소유 키는 반드시 이것**이다 —
      // `memberId` 는 회원 원장과 사번 원장에서 값이 겹칠 수 있어 남의 주문이 섞인다.
      session.user.id = token.sub ?? ''
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
