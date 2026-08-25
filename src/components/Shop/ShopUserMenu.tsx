'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { LogOut, UserRound, ReceiptText } from 'lucide-react'

import { signOutFromShop } from '@/app/actions/auth'
import { toShopIdentity } from '@/lib/shop-identity'

/**
 * 헤더의 «누가 로그인했나» + 로그아웃.
 *
 * 이 몰의 이용자에는 **사번 계정**이 섞여 이름만으로는 동명이인을 가릴 수 없다 — 펼친 화면에
 * 사번을 함께 보여준다. 좁은 화면에서는 이름을 감추고 아이콘만 남긴다(헤더가 장바구니와
 * 로고를 이미 쓰고 있어 이름까지 항상 걸면 줄이 밀린다). 정보는 감춰지지 않는다.
 */
export default function ShopUserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const identity = toShopIdentity(session ?? null)

  // 세션 복원 중이거나 로그인이 아직 붙지 않은 환경에서는 아무것도 그리지 않는다 —
  // 여기서 «담당자님» 같은 고정 문구를 넣으면 잘못된 신원이 잠깐이라도 화면에 걸린다.
  if (status === 'loading' || !identity) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="text-primary hover:bg-bg flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full px-2.5 py-2.5 text-base font-semibold whitespace-nowrap transition-colors sm:px-3"
      >
        <UserRound size={20} strokeWidth={1.5} />

        <span className="hidden max-w-32 truncate sm:inline">{identity.displayName}</span>

        <span className="sr-only">계정 메뉴 열기</span>
      </button>

      {open && (
        <div
          role="menu"
          className="rounded-md absolute right-0 z-50 mt-2 w-64 overflow-hidden bg-white shadow-[0_12px_32px_rgba(1,35,80,0.18)]"
        >
          <div className="px-4 py-3.5">
            <p className="text-text truncate text-base font-semibold">{identity.displayName}</p>

            <p className="text-muted mt-1 truncate text-sm">
              {identity.isEmployee ? '사번' : '아이디'} {identity.memberId}
            </p>

            {identity.affiliation && (
              <p className="text-muted mt-0.5 truncate text-sm">{identity.affiliation}</p>
            )}
          </div>

          <div className="bg-border h-px" aria-hidden="true" />

          <Link
            href="/shop/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="text-muted-strong hover:bg-bg flex w-full items-center gap-2 px-4 py-3.5 text-left text-base font-semibold transition-colors"
          >
            <ReceiptText size={18} strokeWidth={1.8} />
            주문 내역
          </Link>

          <div className="bg-bg h-px" aria-hidden="true" />


          <form action={signOutFromShop}>
            <button
              type="submit"
              role="menuitem"
              className="text-muted hover:bg-bg flex w-full cursor-pointer items-center gap-2 px-4 py-3.5 text-left text-base font-semibold transition-colors"
            >
              <LogOut size={18} strokeWidth={1.8} />
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
