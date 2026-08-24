"use client";

import Image from "next/image";
import { X } from "lucide-react";

import type { Product } from "../product.data";
import QuantityStepper from "../QuantityStepper";
import { useShop } from "@/app/providers/ShopProvider";

interface CartItemProps {
  product: Product;
  quantity: number;
  selected: boolean;
  onToggleSelect: (productId: string) => void;
}

export default function CartItem({
  product,
  quantity,
  selected,
  onToggleSelect,
}: CartItemProps) {
  const { updateQuantity, removeFromCart } = useShop();

  const totalPrice = product.basePrice * quantity;

  // 세모 품목엔 분류·품번이 없는 것도 많다. 조각을 모아 붙여야 값이 빠졌을 때
  // «·» 만 덩그러니 남지 않는다.
  const metaLine = [
    product.tag,
    product.codeLabel && product.code ? `${product.codeLabel} ${product.code}` : product.code,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-light-soft px-5 py-4 sm:flex-nowrap sm:px-6">
      {/* 선택 — 체크박스 자체는 18px 그대로 두고, `before` 로 터치 영역만 44px 로 넓힌다.
        * 네이티브 체크박스는 크기를 키우면 브라우저마다 다르게 그려지므로 모양은 안 건드린다. */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        aria-label={`${product.name} 선택`}
        className="accent-primary relative h-[18px] w-[18px] shrink-0 cursor-pointer before:absolute before:-inset-[13px] before:content-['']"
      />

      {/* 이미지 */}
      <div className="bg-light-soft relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={product.img}
          alt={product.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      {/* 정보 — 한 줄로 끝내고 넘치면 말줄임 */}
      <div className="min-w-0 flex-1 basis-[45%]">
        <h3 className="text-text truncate text-sm font-semibold sm:text-[15px]">{product.name}</h3>

        {metaLine && <p className="text-muted mt-0.5 truncate text-xs">{metaLine}</p>}
      </div>

      {/* 수량 + 금액 — 모바일에서는 정보 아래로 접힌다 */}
      <div className="flex flex-1 items-center justify-between gap-4 sm:flex-none sm:justify-end sm:gap-6">
        {/* 면 하나에 테두리 하나. 버튼과 숫자에 서로 다른 배경을 깔면 세 톤이 겹쳐
          * (카드 bg-light-soft / 버튼 / 숫자) 컨트롤 경계가 어디인지 읽히지 않는다.
          *
          * `onDecrementAtMin` 으로 «1에서 − 를 누르면 줄이 사라지는» 기존 동작을 그대로
          * 잇는다. 직접 입력으로는 0 을 만들 수 없다 — 지우려다 실수로 사라지면 곤란하고,
          * 지우는 자리는 오른쪽 × 로 따로 있다. */}
        <QuantityStepper
          size="sm"
          value={quantity}
          onChange={next => updateQuantity(product.id, next)}
          onDecrementAtMin={() => removeFromCart(product.id)}
          label={`${product.name} 수량`}
        />

        <strong className="text-text shrink-0 text-right text-sm font-semibold sm:w-28 sm:text-base">
          {totalPrice.toLocaleString()}원
        </strong>
      </div>

      {/* 삭제 */}
      <button
        type="button"
        onClick={() => removeFromCart(product.id)}
        className="text-muted hover:text-text relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors before:absolute before:-inset-1.5 before:content-['']"
        aria-label={`${product.name} 삭제`}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </article>
  );
}
