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
 * **코드에 기본값을 두지 않는다.** C-POINT 의 그룹 코드는 아직 정해지지 않았고, 아무 값이나
 * 박아 두면 «닫혀 있는 줄 알았는데 열려 있는» 상태가 된다. 정해지면 `.env` 만 채운다.
 */
export const SHOP_ALLOWED_GROUP_CODES: readonly number[] = parseGroupCodes(
  process.env.CMARKET_GROUP_CODES,
)

/** 로그인이 필요한 경로. `proxy.ts` 의 matcher 와 같은 범위를 가리킨다. */
export const SHOP_PROTECTED_PREFIX = '/shop'

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
    process.env.AUTH_SECRET?.trim() &&
    SHOP_ALLOWED_GROUP_CODES.length > 0,
)

/** 세션의 소속 기관이 이 몰의 것인가. */
export function isAllowedGroup(groupCode: number | undefined | null): boolean {
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
