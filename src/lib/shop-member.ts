import { cookies } from 'next/headers'

import { auth } from '@/auth'
import { IS_SSO_CONFIGURED, viewerTierOf, type ViewerTier } from '@/lib/shop-auth'

/**
 * 서버 라우트·서버 컴포넌트가 「누가」를 정하는 유일한 자리.
 *
 * 주문자·견적서 명의는 반드시 **세션**에서 온다 — 본문으로 받으면 남의 사번으로
 * 주문한다(`/api/shop/orders` 주석 참고).
 *
 * ## 데모 신원 (SHOP_DEMO_MEMBER)
 *
 * 씨마켓 SSO 는 몰 전용 파트너 키가 발급돼야 열린다. 그 전에 주문·견적 화면을
 * 실제로 눌러 보려면 신원이 하나 필요해서, `.env` 에 `SHOP_DEMO_MEMBER` 가 있으면
 * 그 아이디를 로그인한 것으로 친다(`proxy.ts` 의 게이트도 함께 열린다).
 *
 * **운영 환경변수에는 절대 넣지 않는다** — 넣는 순간 주문이 익명이 된다.
 * 실세션이 있으면 언제나 실세션이 이긴다(데모는 빈자리만 채운다).
 *
 * ## SSO 미설정이면 `auth()` 를 부르지 않는다
 *
 * AUTH_SECRET 없이 `auth()` 는 던진다. 그러면 로컬에서 상세·장바구니(공개 화면)까지
 * 500 이 된다 — 공개 화면이 «누가» 를 묻는 건 실명 단가를 보여 줄지 정하기 위해서일
 * 뿐이라, 설정이 없으면 «비로그인» 으로 접는 게 맞다.
 */

export interface ShopMember {
  memberId: string
  displayName: string
  /** 발주기관(FULL) / 공급사 고객(RESTRICTED) — `shop-auth.ts` 참고 */
  tier: ViewerTier
}

/** 데모 역할을 바꾸는 쿠키 — `/api/demo/role?role=SUPPLIER` 가 심는다. 데모 신원이 켜진 환경에서만 읽는다. */
export const DEMO_ROLE_COOKIE = 'cpoint.demoRole'

export function isDemoMode(): boolean {
  return Boolean(process.env.SHOP_DEMO_MEMBER?.trim())
}

/**
 * 데모 신원의 등급. 기본은 `SHOP_DEMO_ROLE`(없으면 BUYER)이고, 쿠키가 있으면 그게 이긴다 —
 * `next dev` 는 디렉터리당 한 인스턴스라 발주기관·공급사 화면을 나란히 띄우려면 역할을
 * 요청 단위로 바꿀 수 있어야 한다.
 */
export async function demoMember(): Promise<ShopMember | null> {
  const memberId = process.env.SHOP_DEMO_MEMBER?.trim()
  if (!memberId) return null

  const jar = await cookies()
  const fromCookie = jar.get(DEMO_ROLE_COOKIE)?.value?.toUpperCase()
  const role = fromCookie || process.env.SHOP_DEMO_ROLE?.trim().toUpperCase() || 'BUYER'
  const tier = viewerTierOf(role, role === 'EMPLOYEE' ? 1000 : null)
  return {
    memberId: tier === 'FULL' ? memberId : `${memberId}-supplier`,
    displayName:
      tier === 'FULL'
        ? process.env.SHOP_DEMO_MEMBER_NAME?.trim() || '데모 담당자'
        : '예시공급사 박대리',
    tier,
  }
}

export async function getShopMember(): Promise<ShopMember | null> {
  if (IS_SSO_CONFIGURED) {
    const session = await auth()
    const user = session?.user

    if (user?.memberId) {
      return {
        memberId: user.memberId,
        displayName: user.name?.trim() || user.memberId,
        tier: viewerTierOf(user.role, user.groupCode),
      }
    }
  }

  return demoMember()
}
