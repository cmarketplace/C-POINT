interface PriceProps {
  price: number;
  className?: string;
}

/**
 * 판매가 한 줄.
 *
 * 종전에는 `DiscountPrice` 였다 — 상수 `SAVING_RATE`(0.15)로 `price / (1 - 0.15)` 를
 * 계산해 **없는 정가**를 취소선으로 찍고 「15%」 배지를 달았다. 그 값의 출처는 어디에도
 * 없다. 세모 피드는 `price` 하나만 내려주고 정가·할인율 축이 아예 없다. 실제 카탈로그
 * 상품에 지어낸 종전거래가격을 붙이는 것이라 표시광고법상으로도 위험했다.
 *
 * 세모 피드가 정가를 내려주기 시작하면 그때 비교 표시를 되살린다 — 계산이 아니라 값으로.
 */
export default function Price({ price, className = "" }: PriceProps) {
  return (
    <strong className={`text-text block text-base font-bold sm:text-lg ${className}`}>
      {price.toLocaleString()}원
    </strong>
  );
}
