import Image from 'next/image'
import Link from 'next/link'

import { TENANT } from '@/config/tenant'

/**
 * 푸터.
 *
 * 사업자 정보(상호·대표·사업자번호·주소)는 **아직 적지 않는다.** C-POINT 의 운영 주체
 * 표기가 확정되지 않아서다(`src/config/tenant.ts` 참고). 모르는 값을 임시로 채워 넣으면
 * 그게 법적 고지의 자리라는 사실 때문에 아무도 다시 안 고친다.
 */
export default function LandingFooter() {
  return (
    <footer className="bg-white">
      <div className="container-content border-bg border-t px-5 py-10 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Image
              src="/images/cmarket-logo.png"
              alt={TENANT.orgName}
              width={525}
              height={105}
              className="h-auto w-[104px]"
            />

            <p className="text-muted mt-4 text-xs leading-5">
              {TENANT.orgName} {TENANT.shopName} · 상품은 세모 물품관리시스템에서 옵니다
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="bg-bg text-text hover:bg-bg-secondary flex min-h-11 items-center rounded-control px-4 text-sm font-medium transition-colors"
            >
              상품 목록
            </Link>
            <Link
              href="/shop/cart"
              className="bg-bg text-text hover:bg-bg-secondary flex min-h-11 items-center rounded-control px-4 text-sm font-medium transition-colors"
            >
              장바구니
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
