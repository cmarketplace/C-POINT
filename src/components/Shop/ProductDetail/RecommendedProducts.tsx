import Image from 'next/image'
import Link from 'next/link'

import Price from '../Price'
import type { Product } from '../product.data'

interface RecommendedProductsProps {
  products: Product[]
  currentProductId: string
  className?: string
}

export default function RecommendedProducts({
  products,
  currentProductId,
  className = 'mt-14',
}: RecommendedProductsProps) {
  const recommendedProducts = products.filter(product => product.id !== currentProductId).slice(0, 6)

  if (recommendedProducts.length === 0) return null

  return (
    <section className={`${className} border-t border-bg bg-white px-5 py-10 sm:px-7`}>
      <h2 className="text-text text-xl font-bold">추천 상품</h2>

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {recommendedProducts.map(product => (
          <Link key={product.id} href={`/shop/${product.id}`} className="group">
            {/* Image */}
            <div className="bg-light-soft relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={product.img}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 20vw, 16.66vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
            </div>

            {/* Info */}
            <div className="px-1 pt-4">
              <h3 className="text-text line-clamp-2 text-sm leading-snug font-semibold sm:text-base">
                {product.name}
              </h3>

              <Price price={product.basePrice} className="mt-2" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
