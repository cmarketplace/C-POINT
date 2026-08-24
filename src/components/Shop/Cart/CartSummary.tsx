"use client";

import type { Product } from "@/components/Shop/product.data";

interface CartSummaryProps {
  /** 체크된 항목만 집계하고 전송한다. 장바구니 전체가 아니다. */
  selectedItems: { product: Product; quantity: number }[];
}

/**
 * 장바구니 합계.
 *
 * **주문/공고 버튼은 아직 없다.** 세모로 실제 주문을 넘기는 경로가 없는 상태에서
 * 버튼만 세우면 «눌렀는데 아무 데도 안 갔다» 가 되고, 화면이 지어낸 완료 페이지로
 * 넘어가면 손님은 주문이 접수된 줄 안다. 붙일 자리만 남겨 둔다.
 */
export default function CartSummary({ selectedItems }: CartSummaryProps) {
  const selectedCount = selectedItems.reduce(
    (count, item) => count + item.quantity,
    0,
  );
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.product.basePrice * item.quantity,
    0,
  );

  return (
    <aside className="rounded-2xl bg-light-soft p-6">
      <div className="space-y-4 rounded-xl bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">선택 상품</span>
          <span className="text-text font-medium">
            {selectedItems.length}종 / {selectedCount}개
          </span>
        </div>

        {selectedItems.length > 0 && (
          <div className="border-y border-dashed border-bg py-1">
            <p className="py-2 text-sm font-semibold text-primary">
              상품별 금액
            </p>

            <ol className="divide-y divide-dashed divide-bg">
              {selectedItems.map(({ product, quantity }, index) => {
                const itemTotal = product.basePrice * quantity;

                return (
                  <li
                    key={product.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">
                        <span className="mr-1.5 text-muted">{index + 1}.</span>
                        {product.name}
                      </p>
                      <p className="mt-1 text-muted">
                        {product.basePrice.toLocaleString()}원 × {quantity}개
                      </p>
                    </div>
                    <strong className="self-end font-semibold text-text">
                      {itemTotal.toLocaleString()}원
                    </strong>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">상품 금액</span>
          <span className="text-text font-medium">
            {totalPrice.toLocaleString()}원
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <span className="text-text font-semibold">총 결제금액</span>

        <strong className="text-primary text-2xl font-semibold">
          {totalPrice.toLocaleString()}원
        </strong>
      </div>

      {/* 주문 경로가 붙기 전까지는 버튼이 아니라 안내다 — 눌리는 것처럼 보이면 안 된다. */}
      <p className="bg-bg text-muted-strong mt-6 rounded-xl px-4 py-3.5 text-center text-sm font-medium">
        주문 접수는 준비 중입니다
      </p>
    </aside>
  );
}
