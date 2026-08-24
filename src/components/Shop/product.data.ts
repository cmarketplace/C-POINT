export interface Product {
  id: string;
  name: string;
  codeLabel: string;
  code: string;
  basePrice: number;
  img: string;
  /** 말단 카테고리 이름. 카드·상세에 그대로 노출한다(예: 「명찰」). */
  tag: string;
  /**
   * 세모 카테고리 계층의 최상위(대분류). 예: 「사무용품」, 「실험/연구실」.
   *
   * 피드가 아직 안 내려주면 빈 문자열이다 — 그 경우 화면은 기존 규칙으로 되돌아간다.
   * 값이 실리기 시작하면 자동으로 이 값을 쓴다(Shop.majorCategoryOf 참고).
   */
  categoryGroup: string;
  desc: string;
  manufacturer: string;
  brand: string;
  unit: string;
  spec1: string;
  spec2: string;
  spec3: string;
  features: string[];
  /**
   * 이 상품을 대는 곳의 수(익명).
   *
   * 2 이상이면 `basePrice` 는 그중 **최저가**다. 손님에게는 «몇 곳이 냈는지» 와
   * «몇 번째로 싼 값인지» 만 보이고, 어느 업체인지는 세모 피드에서부터 빠져 있다.
   */
  offerCount: number;
  /** 말단 카테고리 id. 추천 상품을 같은 카테고리에서만 뽑는 데 쓴다 */
  categoryId: string;
  /** 가장 비싼 오퍼. «최대 N원 절약» 문구에만 쓴다 */
  maxPrice: number | null;
}
