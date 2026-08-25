import OrderComplete from '@/components/Shop/Complete/OrderComplete'
import { getOrder, OrderError } from '@/lib/orders'
import { getShopMember } from '@/lib/shop-member'
import type { StorefrontOrder } from '@/lib/order-types'

// 방금 낸 주문이 그려지는 화면이다. 정적으로 굳으면 지나간 값이 남는다.
export const dynamic = 'force-dynamic'

interface OrderCompletePageProps {
  searchParams: Promise<{ orderNo?: string }>
}

/**
 * 주문 완료 영수증.
 *
 * 정본은 **서버가 확정한 주문**이다 — 장바구니 화면 값을 다시 그리지 않는다
 * (`OrderComplete.tsx` 주석 참고). 남의 주문번호로 열면 「찾을 수 없음」이다:
 * 조회가 주문자 계정으로 묶여 있어 존재 여부조차 새 나가지 않는다.
 */
export default async function OrderCompletePage({ searchParams }: OrderCompletePageProps) {
  const { orderNo } = await searchParams
  const member = await getShopMember()

  let order: StorefrontOrder | null = null

  if (member && orderNo) {
    try {
      order = await getOrder(member.memberId, orderNo)
    } catch (error) {
      // 주문은 이미 섰다. 조회 실패로 완료 화면이 죽으면 담당자는 «주문이 안 됐다» 로
      // 읽고 한 번 더 누른다 — 그게 이 화면에서 가장 피해야 할 결과다.
      if (!(error instanceof OrderError)) throw error
      console.error('[order-complete]', error.status, error.message)
    }
  }

  const orderedAt = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
    // 주문이 있으면 그 주문의 시각이다 — 새로고침마다 바뀌면 그건 주문 일시가 아니다.
  }).format(order ? new Date(order.createdAt) : new Date())

  return <OrderComplete orderedAt={orderedAt} order={order} />
}
