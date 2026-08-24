'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'

import type { Product } from '@/components/Shop/product.data'
import {
  addLine,
  clearLines,
  getServerSnapshot as getCartServerSnapshot,
  getSnapshot as getCartSnapshot,
  removeLine,
  setLineQuantity,
  subscribe as subscribeCart,
  type CartLine,
} from '@/lib/cart'
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  toggleBookmarkId,
} from '@/lib/bookmarks'

interface ShopContextValue {
  cartItems: CartLine[]
  cartCount: number
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  bookmarkedIds: string[]
  isBookmarked: (productId: string) => boolean
  toggleBookmark: (productId: string) => void
}

const ShopContext = createContext<ShopContextValue | null>(null)

export function ShopProvider({ children }: { children: React.ReactNode }) {
  // 장바구니·북마크 둘 다 새로고침과 다른 탭에 남아야 해서 localStorage 를 외부 스토어로
  // 구독한다. 자세한 이유는 src/lib/cart.ts, src/lib/bookmarks.ts 주석 참고.
  const cartItems = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getCartServerSnapshot,
  )
  const bookmarkedIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isBookmarked = (productId: string) => bookmarkedIds.includes(productId)

  /**
   * 헤더 장바구니 배지에 붙는 수 — **담긴 품목의 가짓수**다.
   *
   * 수량을 전부 더하면 A4 용지 하나를 25개로 잡았을 때 배지가 «25» 가 된다 —
   * 손님은 그걸 «장바구니에 25건이 들어 있다» 로 읽는다. 수량 합이 필요한 자리는
   * 장바구니 요약이고, 거기서는 «N종 / M개» 로 둘을 나눠 보여 준다.
   */
  const cartCount = cartItems.length

  return (
    <ShopContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart: addLine,
        removeFromCart: removeLine,
        updateQuantity: setLineQuantity,
        clearCart: clearLines,
        bookmarkedIds,
        isBookmarked,
        toggleBookmark: toggleBookmarkId,
      }}
    >
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  const context = useContext(ShopContext)

  if (!context) {
    throw new Error('useShop must be used within ShopProvider')
  }

  return context
}
