import type { StorefrontOffer } from "@/lib/semo-feed";

interface OfferListProps {
  offers: StorefrontOffer[];
}

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/**
 * 이 상품을 대는 곳들의 값.
 *
 * **업체 이름이 없다.** 세모 피드가 내려주는 값에 공급사를 식별할 컬럼이 아예 없기
 * 때문이다(뷰에서부터 빠져 있다). 손님이 보는 것은 «몇 곳이 냈고, 우리가 그중 어느
 * 값으로 사는가» 뿐이고, 담기는 언제나 1번(최저가)으로 담긴다.
 *
 * 한 곳뿐이면 아무것도 그리지 않는다 — 비교표에 한 줄만 있으면 오히려 «다른 데는
 * 없나» 라는 질문을 만든다.
 */
export default function OfferList({ offers }: OfferListProps) {
  if (offers.length < 2) return null;

  const cheapest = offers[0];
  const dearest = offers[offers.length - 1];
  const saved = dearest.price - cheapest.price;

  return (
    <section className="mt-8 rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-text">
          이 상품을 대는 곳 {offers.length}곳
        </h2>
        {saved > 0 && (
          <span className="text-xs text-muted">
            가장 비싼 값보다{" "}
            <b className="text-highlight-strong">{won(saved)}</b> 아낍니다
          </span>
        )}
      </div>

      <ul className="mt-3 divide-y divide-gray-100">
        {offers.map(offer => (
          <li
            key={offer.offerId}
            className="flex items-center justify-between py-2.5 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-muted">공급처 {offer.priceRank}</span>
              {offer.priceRank === 1 && (
                <span className="rounded-full bg-highlight-soft px-2 py-0.5 text-[11px] font-semibold text-highlight-strong">
                  최저가 · 이 값으로 구매
                </span>
              )}
            </span>
            <span
              className={
                offer.priceRank === 1
                  ? "font-semibold tabular-nums text-text"
                  : "tabular-nums text-muted line-through"
              }
            >
              {won(offer.price)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        같은 품목을 여러 공급처가 댈 수 있습니다. 어디서 오는지와 무관하게 항상
        가장 싼 값으로 담기며, 공급처 정보는 공개되지 않습니다.
      </p>
    </section>
  );
}
