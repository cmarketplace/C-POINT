import { NextResponse } from 'next/server'

import { DEMO_ROLE_COOKIE, isDemoMode } from '@/lib/shop-member'
import { safeNextPath } from '@/lib/shop-auth'

/**
 * 데모 역할 스위치 — `/api/demo/role?role=SUPPLIER&next=/shop`.
 *
 * `SHOP_DEMO_MEMBER` 가 켜진 환경(로컬)에서만 산다. 운영에는 데모 신원이 없으므로 404 다 —
 * 실세션의 역할은 씨마켓 userinfo 가 정하고, 이 스위치는 그것을 건드리지 못한다.
 */
export async function GET(request: Request) {
  if (!isDemoMode()) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const url = new URL(request.url)
  const role = (url.searchParams.get('role') ?? 'BUYER').toUpperCase()
  if (!['BUYER', 'SUPPLIER', 'EMPLOYEE'].includes(role)) {
    return NextResponse.json({ message: 'role 은 BUYER·SUPPLIER·EMPLOYEE 중 하나' }, { status: 400 })
  }

  const response = NextResponse.redirect(new URL(safeNextPath(url.searchParams.get('next')), url.origin))
  response.cookies.set(DEMO_ROLE_COOKIE, role, { path: '/', sameSite: 'lax' })
  return response
}
