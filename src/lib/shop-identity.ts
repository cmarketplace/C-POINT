import type { Session } from 'next-auth'

export interface ShopIdentity {
  /** 화면에 크게 걸리는 이름 — 직원은 본인 이름, 회원 계정은 상호. */
  readonly displayName: string
  /** 사번 또는 회원 아이디. 직원 계정에서 «누가» 를 가르는 실제 축이다. */
  readonly memberId: string
  /** 부서·직급이 있으면 «자재부 대리» 형태로. 둘 다 없으면 null. */
  readonly affiliation: string | null
  /** 부서만. 공고 담당자 표기는 직급을 섞지 않은 부서 한 칸을 따로 쓴다. */
  readonly department: string | null
  readonly isEmployee: boolean
}

/**
 * 세션에서 화면에 쓸 신원을 만든다.
 *
 * 씨마켓에는 회원(`b2b_member`)과 직원(`b2b_employee`) 두 원장이 있고, 이 몰의 실제 이용자는
 * 대부분 **사번 계정**이다. 그래서 이름만 걸면 동명이인을 가릴 수 없다 — 사번을 함께 보여준다.
 *
 * 이름이 비어 있을 수 있다(원장에 값이 없는 계정). 그때 사번만이라도 보이는 편이 «담당자님»
 * 같은 고정 문구보다 낫다 — 적어도 누구로 로그인했는지는 알 수 있다.
 */
export function toShopIdentity(session: Session | null): ShopIdentity | null {
  const user = session?.user
  if (!user?.memberId) return null

  const affiliation = [user.department, user.position].filter(Boolean).join(' ')

  return {
    displayName: user.name?.trim() || user.memberId,
    memberId: user.memberId,
    affiliation: affiliation || null,
    department: user.department?.trim() || null,
    isEmployee: user.role === 'EMPLOYEE',
  }
}
