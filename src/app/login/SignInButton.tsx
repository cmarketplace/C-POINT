'use client'

import { useFormStatus } from 'react-dom'

/**
 * 로그인 제출 버튼.
 *
 * 별도 파일인 이유는 하나다 — `useFormStatus` 는 `<form>` 안의 **클라이언트** 컴포넌트에서만
 * 값을 읽는다. `page.tsx` 는 세션을 조회하는 서버 컴포넌트라 그 자리에 둘 수 없다.
 *
 * 대기 표시가 필요한 이유: 제출하면 서버 액션이 씨마켓 authorize URL 을 계산해 돌려줄 때까지
 * 화면이 그대로다. 그 몇 백 밀리초 동안 아무 신호가 없어 사용자가 버튼을 연타하고, 연타는
 * **state 쿠키를 덮어써서 먼저 뜬 창의 콜백을 실패로 만든다**(KCL 몰 실측).
 */
export function SignInButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="bg-primary hover:bg-primary-dark rounded-control w-full cursor-pointer px-5 py-3.5 text-sm font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? '씨마켓으로 이동 중…' : label}
    </button>
  )
}
