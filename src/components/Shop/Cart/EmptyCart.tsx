"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center px-6 text-center">
      <div className="bg-light-soft text-muted flex h-16 w-16 items-center justify-center rounded-full">
        <ShoppingCart size={28} strokeWidth={1.2} fill="currentColor" />
      </div>

      <h2 className="text-text mt-5 text-lg font-bold">장바구니가 비어있습니다</h2>

      <p className="text-muted mt-2 text-sm">필요한 상품을 장바구니에 담아보세요.</p>

      <Link
        href="/shop"
        className="bg-primary hover:bg-primary-dark mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
      >
        상품 둘러보기
      </Link>
    </div>
  );
}
