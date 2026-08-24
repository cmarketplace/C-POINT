import type { DefaultSession } from 'next-auth'

/**
 * 씨마켓 `/oauth/userinfo` 가 내려주는 신원 축. 세션·JWT 양쪽에 같은 모양으로 실려 다닌다.
 *
 * 아래 세 augmentation 이 필드를 그대로 반복하는 이유: 모듈 확장은 `interface` 병합이라
 * `extends` 만 하고 멤버가 없으면 `@typescript-eslint/no-empty-object-type` 에 걸린다.
 * 값의 정본은 이 주석 위의 씨마켓 계약이고, 여기 셋은 그 사본이다 — 하나를 고치면 셋을 고친다.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      role: 'BUYER' | 'SUPPLIER' | 'EMPLOYEE'
      /** 씨마켓 회원/사번 식별자. 전역 유일 키는 `id`(=`sub`) 쪽이다. */
      memberId: string
      /** 소속 기관 그룹. 몰의 입장 자격은 `src/lib/shop-auth.ts` 가 이 값으로 판정한다. */
      groupCode: number
      department: string | null
      position: string | null
      /** 소속 회사 계정. 회원은 자기 자신, 직원은 상위 회사. */
      companyMemberId: string | null
    } & DefaultSession['user']
  }

  interface User {
    role: 'BUYER' | 'SUPPLIER' | 'EMPLOYEE'
    memberId: string
    groupCode: number
    department: string | null
    position: string | null
    companyMemberId: string | null
  }
}

// Auth.js v5 는 JWT 타입의 실체가 `@auth/core/jwt` 에 있다. `next-auth/jwt` 만 확장하면
// 콜백 인자의 `token` 이 `unknown` 으로 남는다.
declare module '@auth/core/jwt' {
  interface JWT {
    role: 'BUYER' | 'SUPPLIER' | 'EMPLOYEE'
    memberId: string
    groupCode: number
    department: string | null
    position: string | null
    companyMemberId: string | null
  }
}
