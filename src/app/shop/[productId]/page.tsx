import Image from "next/image";
import { notFound } from "next/navigation";

import ShopNav from "@/components/Shop/ShopNav";
import DetailStatusIcon from "@/components/Shop/ProductDetail/DetailStatusIcon";
import ProductPurchase from "@/components/Shop/ProductDetail/ProductPurchase";
import ProductDetailTabs from "@/components/Shop/ProductDetail/ProductDetailTabs";
import OfferList from "@/components/Shop/ProductDetail/OfferList";
import {
  fetchItemOffers,
  fetchRelatedProducts,
  fetchStorefrontProduct,
} from "@/lib/semo-feed";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;

  /*
   * 예전에는 카탈로그를 통째로 받아 그 안에서 한 건을 찾았다. 승인 품목이 수만 건이
   * 되면 상세 한 장에 목록 수십~수백 쪽이 딸려온다. 이제 필요한 것만 세 번 부른다 —
   * 상품 / 그 상품의 익명 단가 리스트 / 같은 카테고리 추천.
   */
  const product = await fetchStorefrontProduct(productId);
  if (!product) notFound();

  const [offers, related] = await Promise.all([
    fetchItemOffers(productId),
    fetchRelatedProducts(product.categoryId),
  ]);
  const products = related.filter(item => item.id !== product.id);

  const detailSpecs = [
    ["제조사", product.manufacturer],
    ["브랜드", product.brand],
    ["단위", product.unit],
    ["규격", product.spec1],
    [product.codeLabel === "CAS" ? "CAS" : "재질·타입", product.spec2],
    ["패키징", product.spec3],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <main className="min-h-screen bg-white">
      <ShopNav showBack />

      <div className="container-shop pb-24 pt-6">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.18fr)_minmax(400px,.82fr)] lg:gap-16 xl:gap-24">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-light-soft">
              <Image
                src={product.img}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.015]"
              />
            </div>

          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-primary">{product.tag}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-highlight-soft px-2.5 py-1 text-xs font-semibold text-highlight-strong">
                <DetailStatusIcon variant="availability" className="h-[15px] w-[15px]" /> 구매 가능
              </span>
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.3] text-text sm:text-4xl">
              {product.name}
            </h1>

            {product.code && (
              <p className="mt-3 text-xs text-muted">
                {product.codeLabel || "품번"} <span className="ml-2 font-medium text-text">{product.code}</span>
              </p>
            )}

            <ProductPurchase product={product} />

            <OfferList offers={offers} />
          </div>
        </section>

        <ProductDetailTabs product={product} products={products} detailSpecs={detailSpecs} />
      </div>
    </main>
  );
}
