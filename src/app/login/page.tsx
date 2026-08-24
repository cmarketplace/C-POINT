import { redirect } from 'next/navigation'
import Image from 'next/image'

import { signInWithCmarket } from '@/app/actions/auth'
import { auth } from '@/auth'
import { TENANT } from '@/config/tenant'
import { IS_SSO_CONFIGURED, isAllowedGroup, safeNextPath } from '@/lib/shop-auth'

/**
 * 로그인 화면.
 *
 * **평소에는 이 화면을 보지 않는다.** `/shop` 접근은 `proxy.ts` 가 씨마켓으로 곧장 보내고,
 * 본진에 로그인해 있으면 화면 전환만으로 들어온다. 여기는 그 흐름이 **끊겼을 때** 서는 자리다 —
 * 기관 자격 거절, 설정 미비, 씨마켓에서 로그인을 취소하고 돌아온 경우, 그리고 직접 방문.
 * 그래서 버튼이 남아 있다: 사유를 보고 다시 시도할 곳이 필요하다.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  // 설정이 없으면 세션도 없다 — `auth()` 는 AUTH_SECRET 없이는 던진다. 먼저 접는다.
  if (!IS_SSO_CONFIGURED) {
    return (
      <LoginShell>
        <p className="text-muted mt-3 text-sm leading-6">
          로그인이 아직 열리지 않았습니다. 씨마켓 SSO 연동 값이 설정되면 이 화면에서 바로
          로그인할 수 있습니다.
        </p>
      </LoginShell>
    )
  }

  const session = await auth()

  // 이미 자격을 갖춘 세션이면 로그인 화면을 보여줄 이유가 없다.
  if (session?.user && isAllowedGroup(session.user.groupCode)) {
    redirect(safeNextPath(next))
  }

  return (
    <LoginShell>
      <p className="text-muted mt-3 text-sm leading-6">
        {TENANT.orgName} 계정으로 이용하는 폐쇄몰입니다. 씨마켓 계정으로 로그인해 주세요.
      </p>

      {error === 'not_allowed' ? (
        <p className="mt-6 rounded-2xl bg-[#fdecec] px-4 py-3 text-sm leading-6 text-[#b42318]">
          로그인은 되었지만 이 몰을 이용할 수 있는 기관 계정이 아닙니다. 담당자에게 문의해
          주세요.
        </p>
      ) : null}

      {error === 'not_configured' ? (
        <p className="mt-6 rounded-2xl bg-[#fdecec] px-4 py-3 text-sm leading-6 text-[#b42318]">
          로그인 설정이 완료되지 않아 지금은 입장할 수 없습니다.
        </p>
      ) : null}

      <form action={signInWithCmarket} className="mt-8">
        <input type="hidden" name="redirectTo" value={safeNextPath(next)} />
        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark w-full cursor-pointer rounded-control px-5 py-3.5 text-sm font-semibold text-white transition-colors"
        >
          씨마켓 계정으로 로그인
        </button>
      </form>
    </LoginShell>
  )
}

/**
 * 로그인 화면의 껍데기. 자체 ID/PW 폼을 두지 않는다 — 자격증명이 두 벌로 갈리고,
 * 사용자가 씨마켓 비밀번호를 다른 도메인에 넣는 습관을 배운다(피싱 표면).
 */
function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-bg flex min-h-screen items-center justify-center px-6">
      <div className="rounded-md w-full max-w-md bg-white p-10 shadow-[0_18px_48px_rgba(1,35,80,0.10)]">
        <Image
          src="/images/cmarket-logo.png"
          alt={TENANT.orgName}
          width={525}
          height={105}
          priority
          className="h-auto w-[118px]"
        />

        <h1 className="text-text mt-6 text-2xl font-bold">{TENANT.shopName}</h1>

        {children}
      </div>
    </main>
  )
}
