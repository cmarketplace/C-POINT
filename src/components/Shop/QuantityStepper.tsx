"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (quantity: number) => void;
  /** 최소 수량. 기본 1 — 「최소 주문 수량 1개」와 같은 값이다. */
  min?: number;
  /** 최대 수량. 자리수를 넘겨 금액이 이상해지는 것만 막는 상한이다. */
  max?: number;
  /**
   * 최소값에서 «−» 를 눌렀을 때 할 일. 장바구니는 여기서 줄을 지운다.
   * 넘기지 않으면 최소값에서 «−» 가 비활성이 된다(상세 화면).
   */
  onDecrementAtMin?: () => void;
  /** `sm` 은 장바구니용 — 모바일에서만 44px 이고 넓은 화면에서 32px 로 줄어든다. */
  size?: "sm" | "md";
  /** 입력칸 스크린리더 이름. 같은 화면에 여러 개 있으면 품명을 섞어 준다. */
  label?: string;
}

/** 숫자만 남긴다. 붙여넣기로 «12개» 나 «1,200» 이 들어와도 12·1200 으로 읽는다. */
function digitsOf(text: string): string {
  return text.replace(/[^0-9]/g, "");
}

/**
 * 수량 조절기 — «−» / 직접 입력 / «+».
 *
 * 예전에는 가운데가 `<span>` 이라 **버튼으로만** 수량을 바꿀 수 있었다. 20개를 담으려면
 * «+» 를 열아홉 번 눌러야 했고, 그건 사무용품처럼 수십 개씩 담는 자리에서는 못 쓸 물건이다.
 * 그래서 가운데를 입력칸으로 바꾼다.
 *
 * 입력 도중에는 **빈 칸을 허용**한다. 매 글자마다 최소값으로 되돌리면 «1» 을 지우고 «20» 을
 * 칠 수가 없다(지우는 순간 1 로 튀어 «120» 이 된다). 그래서 타이핑 중에는 초안 문자열을
 * 그대로 두고, 칸을 벗어나거나 Enter 를 칠 때 한 번만 확정·보정한다.
 *
 * `type=number` 를 쓰지 않는 이유: 화살표 스피너가 붙어 폭이 흔들리고, 휠 스크롤로 값이
 * 조용히 바뀌며, 브라우저마다 «e» 나 «-» 를 받아 준다. 숫자 키패드는 `inputMode` 로 띄운다.
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  onDecrementAtMin,
  size = "md",
  label = "수량",
}: QuantityStepperProps) {
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // 바깥에서 값이 바뀌면(«+» 클릭, 다른 화면에서 수정) 입력칸도 따라간다.
  // 단, 사용자가 그 칸을 치고 있는 중이면 건드리지 않는다 — 커서가 튄다.
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setDraft(String(value));
  }, [value]);

  const commit = (): void => {
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed));
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const atMin = value <= min;
  const handleDecrement = (): void => {
    if (atMin) {
      onDecrementAtMin?.();
      return;
    }
    onChange(value - 1);
  };

  const compact = size === "sm";
  const box = compact ? "h-11 w-11 sm:h-8 sm:w-8" : "h-11 w-11";
  const field = compact ? "h-11 w-12 text-xs sm:h-8" : "h-11 w-14 text-sm";

  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-border bg-white">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={atMin && !onDecrementAtMin}
        aria-label="수량 줄이기"
        className={`text-muted hover:bg-bg hover:text-primary flex cursor-pointer items-center justify-center transition-colors disabled:cursor-default disabled:opacity-35 ${box}`}
      >
        <Minus size={compact ? 14 : 15} />
      </button>

      <input
        ref={inputRef}
        type="text"
        // 휴대폰에서 숫자 키패드를 띄운다. `pattern` 은 iOS 가 키패드를 고를 때 같이 본다.
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        aria-label={label}
        onChange={event => setDraft(digitsOf(event.target.value))}
        onFocus={event => event.target.select()}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault();
            // blur 가 `commit` 을 부른다 — 확정 경로를 하나로 둔다.
            event.currentTarget.blur();
          }
        }}
        className={`text-text focus-visible:ring-primary bg-transparent text-center font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-inset ${field}`}
      />

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="수량 늘리기"
        className={`text-muted hover:bg-bg hover:text-primary flex cursor-pointer items-center justify-center transition-colors disabled:cursor-default disabled:opacity-35 ${box}`}
      >
        <Plus size={compact ? 14 : 15} />
      </button>
    </div>
  );
}
