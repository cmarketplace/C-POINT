/**
 * 이 몰의 폐쇄몰 게이트 — «누가 들어올 수 있는가» 한 곳.
 *
 * 판정 축은 씨마켓 `b2b_member.group_code` 다. 씨마켓도 code 발급 시점에 같은 축으로 한 번
 * 거르지만(등록 클라이언트의 `allowedGroupCodes`), 몰이 자기 문 앞에서 다시 확인한다 —
 * 클라이언트 등록이 잘못 넓어져도 이 몰만은 열리지 않게 하는 두 번째 자물쇠다.
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
 */
export const IS_SSO_CONFIGURED = Boolean(
  process.env.CMARKET_CLIENT_ID?.trim() &&
    process.env.CMARKET_CLIENT_SECRET?.trim() &&
    process.env.CMARKET_AUTHORIZE_URL?.trim() &&
    process.env.AUTH_SECRET?.trim(),
  // 그룹 코드는 더 이상 필수가 아니다 — 모두 개방 몰에서는 비어 있는 게 기본값이다.
)

/** 세션의 소속 기관이 이 몰의 것인가 — 목록이 비어 있으면(모두 개방) 전원 통과다. */
export function isAllowedGroup(groupCode: number | undefined | null): boolean {
  if (SHOP_ALLOWED_GROUP_CODES.length === 0) return true
  return typeof groupCode === 'number' && SHOP_ALLOWED_GROUP_CODES.includes(groupCode)
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
