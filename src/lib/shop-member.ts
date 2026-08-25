import { auth } from '@/auth'

/**
 * 서버 라우트가 「누가」를 정하는 유일한 자리.
 *
 * 주문자·포인트 계정은 반드시 **세션**에서 온다 — 본문으로 받으면 남의 사번으로
 * 주문하고 남의 포인트를 쓴다(`/api/shop/orders` 주석 참고).
 *
 * ## 데모 신원 (SHOP_DEMO_MEMBER)
 *
 * 씨마켓 SSO 는 몰 전용 파트너 키가 발급돼야 열린다. 그 전에 주문·포인트 화면을
 * 실제로 눌러 보려면 신원이 하나 필요해서, `.env` 에 `SHOP_DEMO_MEMBER` 가 있으면
 * 그 아이디를 로그인한 것으로 친다(`proxy.ts` 의 게이트도 함께 열린다).
 *
 * **운영 환경변수에는 절대 넣지 않는다** — 넣는 순간 폐쇄몰이 익명몰이 된다.
 * 실세션이 있으면 언제나 실세션이 이긴다(데모는 빈자리만 채운다).
 */

export interface ShopMember {
  memberId: string
  displayName: string
}

export function demoMember(): ShopMember | null {
  const memberId = process.env.SHOP_DEMO_MEMBER?.trim()
  if (!memberId) return null

  return {
    memberId,
    displayName: process.env.SHOP_DEMO_MEMBER_NAME?.trim() || '데모 담당자',
  }
}

export async function getShopMember(): Promise<ShopMember | null> {
  const session = await auth()
  const user = session?.user

  if (user?.memberId) {
    return { memberId: user.memberId, displayName: user.name?.trim() || user.memberId }
  }

  return demoMember()
}
