/**
 * 주문의 모양과 상태 어휘 — **클라이언트에서도 쓸 수 있는 부분**만 모았다.
 * (FITI 포인트몰과 같은 분리 — 서버 전용 `orders.ts` 가 타입까지 갖고 있으면
 * 화면이 타입을 가져오는 순간 서버 코드가 번들에 딸려 들어간다.)
 *
 * ## 이 몰의 결제 조건: 후불
 *
 * 주문 시점에는 **아무 돈도 오가지 않는다.** 공급사는 저장 단가 최저 조합으로
 * 자동매칭되고(그래서 견적 공고도 없다), 발주기관은 **배송이 다 끝난 뒤** 현금/카드로
 * 플랫폼(엔씨하이)에 한 번에 결제한다. 카드결제창·세금계산서(팝빌)는 그 단계의 일이다.
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
  shipToName: string;
  shipToZip: string;
  shipToAddress: string;
  shipToTel: string | null;
  /** 공급가액 합 */
  totalSupply: number;
  /** 부가세 — 과세 합계에서 한 번만 분리한 값 */
  totalVat: number;
  /** 후불 청구 예정 금액 — 배송완료 후 이 금액을 결제한다. */
  totalPayable: number;
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
  PLACED: "접수되었습니다. 결제는 지금 하지 않습니다 — 곧 공급사가 정해집니다.",
  MATCHED: "가장 저렴한 공급사 조합이 정해졌습니다. 계약이 체결되면 출고가 시작됩니다.",
  CONTRACTED: "계약이 체결되었습니다. 공급사가 출고를 준비합니다.",
  SHIPPING: "물건이 오고 있습니다. 공급사별로 따로 도착할 수 있습니다.",
  DELIVERED: "모두 도착했습니다. 결제 안내(현금/카드)가 이어집니다.",
  INVOICED: "결제와 세금계산서 발행이 진행 중입니다.",
};
