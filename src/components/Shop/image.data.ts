/**
 * 사진이 없는 상품에 붙이는 대표 이미지.
 *
 * 값은 **그대로 <Image src> 에 넣을 수 있는 형태**여야 한다(앞에 `/`). 쓰는 쪽에서
 * `/${product.img}` 로 다시 붙이면 피드가 준 원격 URL 이 `/https://…` 가 되어 깨진다.
 *
 * `placeholder` 는 사진이 아니라 «사진 없음» 판이다. 어떤 분류에도 안 걸리는 상품은
 * 여기로 떨어진다 — 관계없는 스톡 사진을 붙이면 손님이 그것을 상품 사진으로 오인한다.
 */
export const PRODUCT_IMAGES = {
  placeholder: "/images/no-image.svg",
  reagent: "/images/reagent.jpg",
  glass: "/images/glass.jpg",
  special: "/images/special.jpg",
  ware: "/images/products/beaker_0.jpg",
  color: "/images/products/solvent_0.jpg",
  petri: "/images/products/petri_0.jpg",
  ppe: "/images/products/mask_0.jpg",
};
