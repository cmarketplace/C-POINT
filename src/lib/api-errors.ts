import { NextResponse } from 'next/server'

import { OrderError } from '@/lib/orders'

/**
 * 원장 쪽 실패를 화면이 읽을 수 있는 모양으로 옮긴다.
 *
 * 4xx 는 **담당자가 고칠 수 있는 것**이라 문구를 그대로 전한다(취소 불가 사유 등).
 * 5xx 는 담당자가 할 수 있는 게 없으므로 일반 문구로 접고 서버에 남긴다.
 *
 * route.ts 안에 두지 않는 이유: Next 는 라우트 파일의 export 를 HTTP 메서드로
 * 검증해서, 헬퍼를 export 하면 빌드가 깨진다.
 */
export function toErrorResponse(error: unknown, fallback: string) {
  if (error instanceof OrderError) {
    if (error.status >= 400 && error.status < 500) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    console.error('[shop/orders]', error.status, error.message)
    return NextResponse.json({ message: fallback }, { status: 502 })
  }

  console.error('[shop/orders]', error)
  return NextResponse.json({ message: fallback }, { status: 500 })
}
