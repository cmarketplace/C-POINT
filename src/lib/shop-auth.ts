/**
 * 이 몰의 폐쇄몰 게이트 — «누가 들어올 수 있는가» 한 곳.
 *
 * 판정 축은 씨마켓 `b2b_member.group_code` 이고, **정본은 씨마켓 어드민**이다(파트너 키의
 * `sso_allowed_group_codes`). 몰은 그 판정을 다시 하지 않는 것이 기본이다 — 입장 기관이
 * 수시로 늘어나는 몰에서 목록을 두 곳에 두면 어긋나고, 어긋난 것이 화면 어디에도 안 드러난다.
 * 씨마켓이 환경변수 `SSO_CLIENTS` 를 테이블로 승격한 이유가 정확히 그 결함이었다.
 *
 * 그래서 `CMARKET_GROUP_CODES` 는 **선택값**이다. 비워 두면 씨마켓 등록에 맡기고, 특정
 * 기관으로 더 좁히고 싶을 때만 채운다(씨마켓 등록이 잘못 넓어져도 이 몰만은 안 열리게 하는
 * 두 번째 자물쇠). 어느 쪽이든 authorize 단계에서 씨마켓이 이미 한 번 거른 뒤다.
 */

/**
 * 이 몰에 입장 가능한 기관 그룹. 쉼표로 여러 개를 적는다(`1009,1032`).
 *
 * **비워 두면 전체 허용이다** — C-POINT 는 «모두 개방» 몰로 확정됐다(2026-08-25):
 * 특정 기관 폐쇄몰이 아니라, 씨마켓 계정만 있으면 누구든 주문할 수 있다. 특정 기관
 * 전용으로 좁혀야 할 일이 생기면 그때 `.env` 에 코드를 채운다 — 채우는 순간 그
 * 목록만 통과한다.
 */
export const SHOP_ALLOWED_GROUP_CODES: readonly number[] = parseGroupCodes(
  process.env.CMARKET_GROUP_CODES,
)

/**
 * 로그인이 필요한 경로 — **내 기록 화면뿐이다.** `proxy.ts` 의 matcher 와 같은 범위.
 *
 * 열람(목록·상세·장바구니)은 로그인 없이 공개다. 주문·주문내역·영수증은 후불 계약의
 * 당사자(씨마켓 회원)가 필요해서 익명일 수 없다 — 주문 API 는 세션 없이 401 이고,
 * 이 화면들은 로그인 문으로 안내된다.
 */
export const SHOP_PROTECTED_PATHS = ['/shop/orders', '/shop/order-complete'] as const

/**
 * SSO 가 실제로 성립하는 설정인가.
 *
 * 하나라도 비면 로그인은 «버튼은 있는데 눌러도 에러» 가 된다. 그 상태를 게이트가 먼저 알아야
 * 운영에서 문을 닫고(=아무도 못 들어간다), 로컬에서는 화면을 계속 볼 수 있다 — `proxy.ts` 참조.
 *
 * 그룹 코드는 여기 없다. 선택값이라 비어 있는 것이 정상 설정이다.
 */
export const IS_SSO_CONFIGURED = Boolean(
  process.env.CMARKET_CLIENT_ID?.trim() &&
    process.env.CMARKET_CLIENT_SECRET?.trim() &&
    process.env.CMARKET_AUTHORIZE_URL?.trim() &&
    process.env.AUTH_SECRET?.trim(),
)

/**
 * 세션의 소속 기관이 이 몰의 것인가.
 *
 * 목록이 비면 **통과**다. 씨마켓이 code 를 내준 시점에 이미 그 판정을 끝냈고, 여기서 다시
 * 거절하면 「씨마켓은 열어 줬는데 몰이 막는」 상태가 된다 — 사용자에겐 원인이 안 보인다.
 */
export function isAllowedGroup(groupCode: number | undefined | null): boolean {
  if (SHOP_ALLOWED_GROUP_CODES.length === 0) return true
  return typeof groupCode === 'number' && SHOP_ALLOWED_GROUP_CODES.includes(groupCode)
}

/**
 * 로그인 후 돌아갈 곳. **앱 내부 경로만** 허용한다 — 열린 리다이렉트를 막는다.
 * `//evil.com` 은 프로토콜 상대 URL 이라 `/` 로 시작해도 외부다.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/shop'
  return raw
}

/** 숫자가 아닌 항목은 조용히 버리지 않고 **통째로 무효**로 본다 — 오타가 문을 넓히면 안 된다. */
function parseGroupCodes(raw: string | undefined): readonly number[] {
  const items = (raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (items.length === 0) return []

  const codes = items.map(Number)
  if (codes.some((code) => !Number.isInteger(code))) return []
  return codes
}
