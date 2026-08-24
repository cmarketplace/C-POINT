"use client";

import { useEffect, useState } from "react";

import { syncPrices } from "@/lib/cart";

import ShopNav from "@/components/Shop/ShopNav";
import CartItem from "@/components/Shop/Cart/CartItem";
import CartSummary from "@/components/Shop/Cart/CartSummary";
import EmptyCart from "@/components/Shop/Cart/EmptyCart";
import RecommendedCarousel from "@/components/Shop/RecommendedCarousel";
import type { Product } from "@/components/Shop/product.data";
import { useShop } from "@/app/providers/ShopProvider";

interface CartViewProps {
  /** 장바구니 하단 추천 상품. 피드를 못 불러오면 빈 배열이 오고 캐러셀은 렌더되지 않는다. */
  products: Product[];
}

export default function CartView({ products }: CartViewProps) {
  const { cartItems, removeFromCart } = useShop();

  // 「선택된 것」이 아니라 「해제한 것」을 담는다. 이러면 새로 담긴 상품이 자동으로
  // 선택 상태가 되고, 삭제된 상품의 id 가 남아도 장바구니에 없으니 아무 영향이 없다.
  // 선택 목록을 들고 있으면 장바구니가 바뀔 때마다 effect 로 맞춰줘야 한다.
  const [deselectedIds, setDeselectedIds] = useState<string[]>([]);

  /*
   * 담아 둔 값은 «담던 순간» 의 사본이다. 며칠 전에 담은 줄이 그대로 남아 있으면
   * 합계가 지금 값과 다르므로, 이 화면이 열릴 때 한 번 최신값으로 맞춘다.
   * 사라진 품목은 함께 내려간다 — 주문할 수 없는 줄을 남기면 합계만 틀린다.
   */
  useEffect(() => {
    void syncPrices();
  }, []);

  const isEmpty = cartItems.length === 0;
  const selectedItems = cartItems.filter(item => !deselectedIds.includes(item.product.id));
  const allSelected = !isEmpty && selectedItems.length === cartItems.length;

  const toggleSelect = (productId: string) => {
    setDeselectedIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId],
    );
  };

  const toggleSelectAll = () => {
    setDeselectedIds(allSelected ? cartItems.map(item => item.product.id) : []);
  };

  const removeSelected = () => {
    selectedItems.forEach(item => removeFromCart(item.product.id));
  };

  return (
    <main className="min-h-screen bg-white">
      <ShopNav showBack />

      <div className="container-shop flex min-h-[calc(100svh-4rem)] flex-col py-10 lg:py-14">
        {/* Header */}
        <div>
          <h1 className="text-text text-xl font-semibold tracking-[-0.03rem]">장바구니</h1>

          {!isEmpty && (
            <p className="text-muted mt-2 text-sm">
              담은 상품 중 주문할 항목만 선택하세요.
            </p>
          )}
        </div>

        {/* Empty */}
        {isEmpty ? (
          <div className="mt-8">
            <EmptyCart />
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
            {/* Cart Items */}
            <section className="space-y-3">
              {/* 전체선택 / 선택삭제 */}
              <div className="flex items-center justify-between gap-4 rounded-xl bg-highlight-soft px-5 py-3.5 sm:px-6">
                {/* label 이 체크박스를 감싸고 있으므로 label 자체에 44px 높이를 줘 «전체선택»
                  * 글자까지가 터치 영역이 된다. 체크박스 모양은 18px 그대로 둔다. */}
                <label className="text-text flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="전체 선택"
                    className="accent-primary h-[18px] w-[18px] cursor-pointer"
                  />
                  전체선택
                  <span className="text-muted font-normal">
                    ({selectedItems.length}/{cartItems.length})
                  </span>
                </label>

                <button
                  type="button"
                  onClick={removeSelected}
                  disabled={selectedItems.length === 0}
                  className="text-muted hover:text-text flex min-h-11 cursor-pointer items-center text-sm transition-colors disabled:cursor-default disabled:opacity-40"
                >
                  선택삭제
                </button>
              </div>

              {cartItems.map(item => (
                <CartItem
                  key={item.product.id}
                  product={item.product}
                  quantity={item.quantity}
                  selected={!deselectedIds.includes(item.product.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </section>

            {/* Summary */}
            <CartSummary selectedItems={selectedItems} />
          </div>
        )}

        <RecommendedCarousel
          products={products}
          excludeIds={cartItems.map(item => item.product.id)}
          className="mt-auto pt-14"
        />
      </div>
    </main>
  );
}
