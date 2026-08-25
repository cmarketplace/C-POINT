import { NextResponse } from 'next/server'

import { toErrorResponse } from '@/lib/api-errors'
import { createOrder, listOrders } from '@/lib/orders'
import { getShopMember } from '@/lib/shop-member'
import type { OrderShipTo } from '@/lib/order-types'
import type { StubOrderLine } from '@/lib/postpaid-mall-stub'

/**
 * 몰 주문 — 브라우저와 원장 사이의 유일한 통로.
 *
 *   1) **주문자** — 요청 본문이 아니라 **세션**에서. 열람은 공개몰이지만 주문은
 *      후불 계약의 당사자가 필요해서 익명일 수 없다(로그인 없으면 401).
 *   2) **배송지** — 이 몰은 모두 개방이라 고정 사업장 목록이 없다. 주문자가 적은
 *      주소를 받되 서버가 모양을 검증한다.
 *   3) **금액** — 스텁 단계에서는 화면 스냅샷 단가를 받아 서버가 합산하고,
 *      세모 연동 후에는 단가 자체를 받지 않는다(카탈로그가 재확정).
 */

/** 한 번에 담을 수 있는 줄 수. 세모 주문 DTO 상한과 같은 값이다. */
const MAX_LINES = 200

interface OrderRequestBody {
  shipTo?: unknown
  items?: unknown
  clientOrderKey?: unknown
}

/** 본문의 품목 배열을 신뢰할 수 있는 모양으로 좁힌다. 한 줄이라도 깨졌으면 전체 거절. */
function parseLines(raw: unknown): StubOrderLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) return null

  const lines: StubOrderLine[] = []
  for (const entry of raw) {
    const line = entry as {
      itemId?: unknown
      name?: unknown
      spec?: unknown
      unit?: unknown
      quantity?: unknown
      unitPrice?: unknown
    }

    const itemId = typeof line.itemId === 'string' ? line.itemId.trim() : ''
    const name = typeof line.name === 'string' ? line.name.trim() : ''
    const quantity = Number(line.quantity)
    const unitPrice = Number(line.unitPrice)

    if (!itemId || !name) return null
    if (!Number.isInteger(quantity) || quantity < 1) return null
    if (!Number.isInteger(unitPrice) || unitPrice < 1) return null

    lines.push({
      itemId,
      name,
      spec: typeof line.spec === 'string' && line.spec ? line.spec : null,
      unit: typeof line.unit === 'string' && line.unit ? line.unit : null,
      quantity,
      unitPrice,
    })
  }
  return lines
}

/**
 * 배송지 검증 — 형식은 느슨하게, 빈 값은 엄격하게.
 *
 * 우편번호 5자리·주소 5자 이상만 본다. 더 조이면(도로명 사전 대조 등) 정당한 주소가
 * 막히고, 덜 조이면 빈 종이가 나간다 — 배송지가 비어 있는 주문이 최악이다.
 */
function parseShipTo(raw: unknown): OrderShipTo | string {
  const value = raw as
    | { name?: unknown; zip?: unknown; address?: unknown; tel?: unknown }
    | undefined

  const name = typeof value?.name === 'string' ? value.name.trim() : ''
  const zip = typeof value?.zip === 'string' ? value.zip.trim() : ''
  const address = typeof value?.address === 'string' ? value.address.trim() : ''
  const tel = typeof value?.tel === 'string' ? value.tel.trim() : ''

  if (!name || name.length > 60) return '받는 곳 이름을 확인해 주세요(1~60자).'
  if (!/^\d{5}$/.test(zip)) return '우편번호는 숫자 5자리입니다.'
  if (address.length < 5 || address.length > 200) return '주소를 확인해 주세요(5자 이상).'
  if (tel && !/^[\d\-+() ]{7,20}$/.test(tel)) return '연락처 형식을 확인해 주세요.'

  return { name, zip, address, tel: tel || null }
}

export async function POST(request: Request) {
  const member = await getShopMember()
  if (!member) {
    return NextResponse.json(
      { message: '주문하려면 씨마켓 계정으로 로그인해 주세요.' },
      { status: 401 },
    )
  }

  let body: OrderRequestBody
  try {
    body = (await request.json()) as OrderRequestBody
  } catch {
    return NextResponse.json({ message: '요청 본문을 읽지 못했습니다.' }, { status: 400 })
  }

  const lines = parseLines(body.items)
  if (!lines) {
    return NextResponse.json(
      { message: `주문 품목이 올바르지 않습니다(1~${MAX_LINES}줄, 수량은 1 이상).` },
      { status: 400 },
    )
  }

  const shipTo = parseShipTo(body.shipTo)
  if (typeof shipTo === 'string') {
    return NextResponse.json({ message: shipTo }, { status: 400 })
  }

  try {
    const order = await createOrder({
      memberId: member.memberId,
      shipTo,
      lines,
      clientOrderKey:
        typeof body.clientOrderKey === 'string' && body.clientOrderKey ? body.clientOrderKey : null,
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, '주문을 등록하지 못했습니다.')
  }
}

/** 내 주문 내역. 남의 주문은 볼 수 없다 — 계정을 세션에서만 받기 때문이다. */
export async function GET() {
  const member = await getShopMember()
  if (!member) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const page = await listOrders(member.memberId)
    return NextResponse.json(page)
  } catch (error) {
    return toErrorResponse(error, '주문 내역을 불러오지 못했습니다.')
  }
}
