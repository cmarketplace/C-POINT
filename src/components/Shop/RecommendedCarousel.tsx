"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Product } from "./product.data";
import ProductCard from "./ProductCard";

interface RecommendedCarouselProps {
  products: Product[];
  title?: string;
  className?: string;
  /** 이미 장바구니에 있는 상품은 추천에서 뺀다. */
  excludeIds?: string[];
  /** 캐러셀에 태울 최대 개수. 너무 길면 스크롤만 길어지고 고르기 어려워진다. */
  limit?: number;
}

export default function RecommendedCarousel({
  products,
  title = "추천 상품",
  className = "mt-14",
  excludeIds = [],
  limit = 12,
}: RecommendedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const items = products.filter(product => !excludeIds.includes(product.id)).slice(0, limit);

  // 화살표는 «더 볼 게 있을 때» 만 살아 있어야 한다. 상품이 한 화면에 다 들어오면
  // 양쪽 다 비활성이고, 그때는 화살표를 아예 감춘다.
  const syncEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const max = track.scrollWidth - track.clientWidth;
    setAtStart(track.scrollLeft <= 1);
    // 소수점 스크롤 위치 때문에 정확히 max 에 도달하지 않는 브라우저가 있다.
    setAtEnd(track.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    syncEdges();

    const observer = new ResizeObserver(syncEdges);
    observer.observe(track);

    return () => observer.disconnect();
  }, [syncEdges, items.length]);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    // 한 화면에서 살짝 덜 움직여야 앞뒤 맥락이 남는다.
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  const scrollable = !(atStart && atEnd);

  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-text text-xl font-semibold">{title}</h2>

        {/* 손가락 스와이프가 기본이고 화살표는 넓은 화면의 보조 수단이다(DESIGN.md).
          * 모바일에서는 36px 짜리 원형 버튼 두 개가 터치 최소 크기(44px)에도 못 미쳐
          * 누르기 어려웠다 — 스와이프로 충분한 자리라 좁은 화면에서는 내린다. */}
        {scrollable && (
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={atStart}
              aria-label="이전 상품 보기"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-bg text-text transition-colors duration-200 hover:bg-bg-secondary disabled:cursor-default disabled:opacity-35 disabled:hover:bg-bg"
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={atEnd}
              aria-label="다음 상품 보기"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-bg text-text transition-colors duration-200 hover:bg-bg-secondary disabled:cursor-default disabled:opacity-35 disabled:hover:bg-bg"
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        onScroll={syncEdges}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map(product => (
          <div
            key={product.id}
            className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-[23%] xl:w-[18.5%]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
