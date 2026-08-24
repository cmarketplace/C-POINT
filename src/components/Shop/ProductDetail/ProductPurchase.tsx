"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";

import { TENANT } from "@/config/tenant";
import type { Product } from "../product.data";
import { useShop } from "@/app/providers/ShopProvider";
import QuantityStepper from "../QuantityStepper";
import DetailStatusIcon from "./DetailStatusIcon";

interface ProductPurchaseProps { product: Product }

export default function ProductPurchase({ product }: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1);
  const { cartItems, addToCart, updateQuantity } = useShop();
  const isInCart = cartItems.some(item => item.product.id === product.id);
  const totalPrice = product.basePrice * quantity;
  const brandLabel = [...new Set([product.brand, product.manufacturer].filter(Boolean))].join(" · ");

  const handleAddToCart = () => {
    if (isInCart) updateQuantity(product.id, quantity);
    else addToCart(product, quantity);
  };

  return (
    <div className="mt-7">
      {brandLabel && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">브랜드</span>
          <strong className="font-semibold text-text">{brandLabel}</strong>
        </div>
      )}

      <div className={`${brandLabel ? "mt-5" : ""} flex items-end justify-between gap-6 rounded-xl bg-light-soft px-5 py-5`}>
        {/* 종전에는 여기에 「15%」 배지와 지어낸 정가가 취소선으로 붙어 있었다.
          * 세모 피드에 정가 축이 없어 판매가에서 역산한 값이었다 — 근거가 없어 걷어냈다. */}
        <p className="text-xs font-medium text-muted">{TENANT.priceLabel}</p>
        <div className="shrink-0 text-right">
          <div className="flex items-end justify-end">
            <strong className="text-4xl font-semibold leading-none text-text sm:text-[42px]">
              {totalPrice.toLocaleString()}
            </strong>
            <span className="ml-1.5 text-xl font-semibold leading-none text-text">원</span>
          </div>
          <p className="mt-2 text-xs text-muted">수량 {quantity}개 기준</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {/* 세 줄은 서로 다른 계열이어야 «세 가지» 로 읽힌다. 첫 줄에 highlight(민트)를
          * 쓰면 둘째 줄의 초록과 거의 같은 색이 되어 두 줄이 한 덩어리로 뭉친다. */}
        <div className="flex items-center gap-3 rounded-xl bg-accent/30 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
            <DetailStatusIcon variant="supplier" className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-text">검증된 공급사</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[#F0F9F6] px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D7F2E9] text-[#12AD80]">
            <DetailStatusIcon variant="delivery" className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-text">안정적인 납품 관리</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[#F7F3FD] px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EADFFD] text-[#8E62E8]">
            <DetailStatusIcon variant="standard" className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-text">표준 규격 품목</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl bg-light-soft px-4 py-4">
        <div>
          <span className="text-sm font-semibold text-text">주문 수량</span>
          <p className="mt-0.5 text-xs text-muted">최소 주문 수량 1개</p>
        </div>
        {/* 장바구니(CartItem)와 **같은 컴포넌트**를 쓴다 — 같은 컨트롤이 화면마다 다르게
          * 보이거나 다르게 동작하면 같은 것으로 읽히지 않는다. */}
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          label={`${product.name} 주문 수량`}
        />
      </div>

      {/* 주문 경로가 아직 없어 이 화면의 실행은 「장바구니 담기」 하나다. */}
      <button
        type="button"
        onClick={handleAddToCart}
        className={`mt-5 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${isInCart ? "bg-highlight-soft text-highlight-strong" : "bg-primary text-white hover:bg-primary-dark"}`}
      >
        {isInCart ? <Check size={18} strokeWidth={1.5} /> : <ShoppingCart size={18} strokeWidth={1.2} fill="currentColor" />}
        {isInCart ? `장바구니에 담김 · 수량 ${quantity}개로 변경` : "장바구니 담기"}
      </button>
    </div>
  );
}
