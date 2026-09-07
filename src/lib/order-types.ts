/**
 * 주문의 모양과 상태 어휘 — **클라이언트에서도 쓸 수 있는 부분**만 모았다.
 * (FITI 포인트몰과 같은 분리 — 서버 전용 `orders.ts` 가 타입까지 갖고 있으면
 * 화면이 타입을 가져오는 순간 서버 코드가 번들에 딸려 들어간다.)
 *
 * ## 주문 경로 두 가지 (2026-09-07 결정)
 *
 *   SAFE   씨마켓 안전결제 — 씨마켓이 대금을 받아 공급사에 정산한다. 계약 상대 1곳,
 *          세금계산서 1장(씨마켓 발행), 카드 결제 가능, 교환·반품 창구는 씨마켓.
 *          엔씨하이는 이 거래에서 돈을 받지 않고 플랫폼 수수료만 씨마켓에 별도 청구한다.
 *   DIRECT 공급사 직접 구매 — 공급사와 직접 계약한다. 계약 상대·계산서·결제가 공급사
 *          수만큼이고, 문제는 해당 공급사와 직접 처리한다.
 *
 * 어느 쪽이든 **후불**이다. 주문 시점에는 돈이 오가지 않고, 납품 검수 뒤 청구된다.
 *
 *   PLACED → MATCHED → CONTRACTED → SHIPPING → DELIVERED → INVOICED → SETTLED
 *
 * 지금 스텁은 PLACED 까지만 만든다 — 이후 상태는 세모 파이프라인이 옮긴다. 어휘를
 * 미리 다 두는 이유: 상태 집합을 나중에 늘리면 그 값을 읽던 화면 조건절이 **에러
 * 없이 조용히** 빠뜨린다(KCL 재검수에서 확인된 사고 유형).
 */

export type OrderStatus =
  | "PLACED"
  | "MATCHED"
  | "CONTRACTED"
  | "SHIPPING"
  | "DELIVERED"
  | "INVOICED"
  | "SETTLED"
  | "CANCELED";

export type OrderRoute = "SAFE" | "DIRECT";

export type PaymentMethod = "TAX_INVOICE" | "CARD";

export const ORDER_ROUTE_LABEL: Record<OrderRoute, string> = {
  SAFE: "씨마켓 안전결제",
  DIRECT: "공급사 직접 구매",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  TAX_INVOICE: "세금계산서 후불",
  CARD: "법인카드 · 씨마켓 결제창",
};

/** 취소를 받아 주는 상태. 공급사별 계약(CONTRACTED)이 선 뒤에는 관리자 개입 경로다. */
export const CANCELABLE_STATUSES: readonly OrderStatus[] = ["PLACED", "MATCHED"];

export interface OrderItem {
  seq: number;
  itemId: string;
  name: string;
  spec: string | null;
  unit: string | null;
  quantity: number;
  /** 공급가액 단가. 이 몰의 표시가는 부가세 별도다(`cart-amounts.ts`). */
  unitPrice: number;
  /** 손님이 고른(또는 자동 선정된) 오퍼. 세모 연동 전 주문·옛 주문은 null. */
  offerId: string | null;
  supplierName: string | null;
}

/** 주문자가 직접 적는 배송지 — 이 몰은 모두 개방이라 고정 사업장 목록이 없다. */
export interface OrderShipTo {
  name: string;
  zip: string;
  address: string;
  tel: string | null;
}

export interface StorefrontOrder {
  /** 주문번호. 지금은 스텁 채번 — 세모 연동 시 세모 구매번호로 바뀐다. */
  orderNo: string;
  status: OrderStatus;
  /** 주문자(씨마켓 회원/사번). 세션에서만 온다. */
  memberId: string;
  route: OrderRoute;
  paymentMethod: PaymentMethod | null;
  /** 이 주문의 근거 견적서. 없으면 장바구니에서 바로 낸 주문이다. */
  quoteNo: string | null;
  shipToName: string;
  shipToZip: string;
  shipToAddress: string;
  shipToTel: string | null;
  /** 공급가액 합 */
  totalSupply: number;
  /** 배송비 합 */
  totalShipping: number;
  /** 부가세 — 과세 합계에서 한 번만 분리한 값 */
  totalVat: number;
  /** 후불 청구 예정 금액 — 배송완료 후 이 금액을 결제한다. */
  totalPayable: number;
  /** 이 주문에 얽힌 공급사 수 = 직접 구매 시 계약·계산서 수 */
  supplierCount: number;
  canceledAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderListPage {
  orders: StorefrontOrder[];
  total: number;
}

/** 상태 → 화면 문구. 한 곳에 모아 목록·상세·영수증이 다른 말을 하지 않게 한다. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: "접수됨",
  MATCHED: "공급사 확정",
  CONTRACTED: "계약 체결",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  INVOICED: "결제·계산서 진행",
  SETTLED: "거래 완료",
  CANCELED: "취소됨",
};

/** 그 상태에서 「지금 무슨 일이 일어나고 있나」 — 후불이라 «언제 얼마를 내는가» 가 핵심이다. */
export const ORDER_STATUS_HINT: Partial<Record<OrderStatus, string>> = {
  PLACED: "접수되었습니다. 결제는 지금 하지 않습니다 — 곧 공급사가 확정됩니다.",
  MATCHED: "공급사가 확정되었습니다. 계약이 체결되면 출고가 시작됩니다.",
  CONTRACTED: "계약이 체결되었습니다. 공급사가 출고를 준비합니다.",
  SHIPPING: "물건이 오고 있습니다. 공급사별로 따로 도착할 수 있습니다.",
  DELIVERED: "모두 도착했습니다. 결제 안내가 이어집니다.",
  INVOICED: "결제와 세금계산서 발행이 진행 중입니다.",
};

/**
 * 경로별 «누구에게 얼마를 어떻게 내는가». 결제 화면·영수증·주문 내역이 같은 말을 한다.
 */
export function routeSummary(route: OrderRoute, supplierCount: number) {
  const n = Math.max(1, supplierCount);
  return route === "SAFE"
    ? {
        counterpart: "씨마켓플레이스(주) 1곳",
        invoice: "씨마켓 발행 1장",
        payment: "납품 검수 후 씨마켓에 1회 결제 · 카드 가능",
        shipping: `공급사 ${n}곳 발송 · 씨마켓이 한 화면에서 추적`,
        support: "교환·반품·환불은 씨마켓이 책임",
      }
    : {
        counterpart: `공급사 ${n}곳 각각`,
        invoice: `공급사별 발행 ${n}장`,
        payment: `공급사별 계좌로 ${n}회 후불`,
        shipping: `공급사 ${n}곳 개별 발송 · 개별 추적`,
        support: "해당 공급사와 직접 처리",
      };
}
