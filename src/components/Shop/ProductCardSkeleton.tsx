/**
 * 목록을 새로 받는 동안 자리를 잡아 두는 카드.
 *
 * 대분류를 바꾸면 서버에 다시 물어야 해서 결과가 오기까지 한 박자가 뜬다. 그동안
 * **직전 목록을 그대로 두면 «눌렀는데 아무 일도 안 일어난다»** 로 읽힌다(렉으로 보인다).
 * 게다가 그 잠깐 동안 화면에 남아 있는 것은 방금 떠난 분류의 상품이라, 늦게 바뀌는
 * 것보다 «잘못된 것을 보여주는 것» 에 가깝다.
 *
 * 그래서 누른 즉시 이 자리표시자로 갈아 끼운다. 실제 카드와 같은 크기·간격이라
 * 목록이 도착해도 화면이 튀지 않는다.
 */
export default function ProductCardSkeleton() {
  return (
    <article className="min-w-0" aria-hidden="true">
      <div className="aspect-square animate-pulse rounded-media bg-bg" />

      <div className="pt-3.5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-bg" />
        <div className="mt-2.5 h-3.5 w-full animate-pulse rounded bg-bg" />
        <div className="mt-1.5 h-3.5 w-2/3 animate-pulse rounded bg-bg" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-bg" />
      </div>
    </article>
  );
}
