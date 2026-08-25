import { NextResponse } from 'next/server'

import { toErrorResponse } from '@/lib/api-errors'
import { cancelOrder } from '@/lib/orders'
import { getShopMember } from '@/lib/shop-member'

/**
 * 주문 취소 — 접수(PLACED)·공급사 확정(MATCHED)까지만 받아 준다.
 *
 * 후불이라 되돌릴 결제가 없다 — 상태만 CANCELED 로 닫힌다. 계약이 선 뒤(CONTRACTED~)의
 * 취소는 공급사·계약이 얽혀 화면 버튼으로 풀 수 없는 일이라 409 로 거절한다.
 *
 * DELETE 가 아니라 POST /cancel 인 이유: 취소는 삭제가 아니다 — 주문은 CANCELED
 * 상태로 계속 남아 이력에서 보인다.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  const member = await getShopMember()
  if (!member) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { orderNo } = await params

  try {
    const order = await cancelOrder(member.memberId, orderNo)
    return NextResponse.json({ order })
  } catch (error) {
    return toErrorResponse(error, '주문을 취소하지 못했습니다.')
  }
}
