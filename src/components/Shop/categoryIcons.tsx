/**
 * 카테고리 아이콘 — 파스텔 타일용 SVG 한 벌.
 *
 * 쇼핑몰 카테고리 레일과 랜딩 히어로가 **같은 아이콘·같은 팔레트**를 쓴다. 히어로에서
 * 본 타일이 몰에 들어가면 그대로 있어야 «같은 곳» 으로 읽힌다 — 그래서 한 파일에 둔다.
 */

import type { CSSProperties } from "react";

export type CategoryIconVariant = "grid" | "tag" | "mail" | "pencil" | "eraser" | "book" | "pen" | "magnet" | "ruler" | "clip" | "scissors" | "palette" | "lab" | "shield" | "box";

/**
 * 카테고리 아이콘 여섯 색.
 *
 * 브랜드색(보라)이 아니라 **상품 갈래를 구분하는 파스텔**이다 — 여섯이 서로 달라야
 * 레일이 읽힌다. 그래서 UI 를 보라로 통일한 뒤에도 이 여섯은 각자 색을 지킨다.
 */
export const iconPalettes = [
  { strong: "#5B6BE8", soft: "#CDD3F8" },
  { strong: "#FF5D6C", soft: "#FFC9CF" },
  { strong: "#12AD80", soft: "#BDEBDD" },
  { strong: "#FF8A3D", soft: "#FFD7BC" },
  { strong: "#8E62E8", soft: "#DCCCF8" },
  { strong: "#00A5C8", soft: "#B9E8F1" },
];

/**
 * 세모 대분류 20개 → 아이콘. 목록이 DB 에서 고정되어 있으므로 추측하지 않고 못박는다.
 * (세모 items_v2_categories 의 최상위 계층. 2026-08-18 기준)
 *
 * 여기 없는 이름이 오면 아래 정규식으로 넘어간다 — 말단 카테고리 칩과, 대분류가
 * 새로 생겼는데 이 표를 아직 못 고친 경우를 함께 받아 준다.
 */
const MAJOR_CATEGORY_ICONS: Record<string, CategoryIconVariant> = {
  "실험/연구실": "lab",
  "사무용품": "tag",
  "필기구": "pen",
  "사무기기": "book",
  "복사용지&지류용품": "mail",
  "화일/바인더": "book",
  "잉크/토너/드럼": "pen",
  "디자인문구/학용품": "pencil",
  "미술/화방용품": "palette",
  "도장/상패": "clip",
  "금고/사무용가구": "box",
  "산업/MRO자재": "shield",
  "디지털/가전": "box",
  "생활/주방": "scissors",
  "식품/건강": "box",
  "패션/뷰티": "palette",
  "취미/레저/계절": "palette",
  "모바일쿠폰": "mail",
  "선장품": "box",
  "기타": "box",
};

export function iconForCategory(category: string): CategoryIconVariant {
  if (category === "전체") return "grid";

  const major = MAJOR_CATEGORY_ICONS[category];
  if (major) return major;

  if (/봉투|서식|장부/.test(category)) return "mail";
  if (/샤프|연필/.test(category)) return "pencil";
  if (/수정펜|지우개/.test(category)) return "eraser";
  if (/제본/.test(category)) return "book";
  if (/유성펜|수성펜|볼펜|마커/.test(category)) return "pen";
  if (/자석/.test(category)) return "magnet";
  if (/제도|자\/각도기/.test(category)) return "ruler";
  if (/집게|클립|크립|핀|책철/.test(category)) return "clip";
  if (/칼|가위/.test(category)) return "scissors";
  if (/미술|학용/.test(category)) return "palette";
  if (/시약|용액|화학|산|알코올|초자|유리|비커|플라스크/.test(category)) return "lab";
  if (/사무|문구|명찰|용지/.test(category)) return "tag";
  if (/위생|보호|장갑|마스크/.test(category)) return "shield";
  return "box";
}

export function FilledCategoryIcon({ variant, active, palette, sizeClass = "h-7 w-7" }: { variant: CategoryIconVariant; active: boolean; palette: (typeof iconPalettes)[number]; sizeClass?: string }) {
  const main = "fill-[var(--icon-main)]";
  const detail = "fill-[var(--icon-detail)]";
  const iconStyle = {
    "--icon-main": active ? palette.strong : palette.soft,
    "--icon-detail": active ? "#FFFFFF" : "var(--color-light-soft)",
  } as CSSProperties;
  const gesture = {
    grid: "rotate-[-2deg]",
    tag: "rotate-[4deg]",
    mail: "rotate-[-3deg]",
    pencil: "rotate-[2deg]",
    eraser: "rotate-[-4deg]",
    book: "rotate-[2deg]",
    pen: "rotate-[-2deg]",
    magnet: "rotate-[3deg]",
    ruler: "rotate-[-3deg]",
    clip: "rotate-[5deg]",
    scissors: "rotate-[-4deg]",
    palette: "rotate-[3deg]",
    lab: "rotate-[-2deg]",
    shield: "rotate-[2deg]",
    box: "rotate-[-2deg]",
  }[variant];

  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" style={iconStyle} className={`${sizeClass} origin-center transition-transform duration-200 group-hover:scale-105 ${gesture}`}>
      {variant === "grid" && <><rect x="5" y="5" width="9" height="9" rx="3.5" className={main}/><rect x="18" y="5" width="9" height="9" rx="3.5" className={main}/><rect x="5" y="18" width="9" height="9" rx="3.5" className={main}/><rect x="18" y="18" width="9" height="9" rx="3.5" className={main}/></>}
      {variant === "tag" && <><path d="M4 9c0-3 2-5 5-5h7.2c1.3 0 2.5.5 3.4 1.4l7 7a5.5 5.5 0 0 1 0 7.8l-6.4 6.4a5.5 5.5 0 0 1-7.8 0l-7-7A5 5 0 0 1 4 16.2V9Z" className={main}/><circle cx="10.5" cy="10.5" r="2.7" className={detail}/></>}
      {variant === "mail" && <><rect x="3" y="7" width="26" height="18" rx="7" className={main}/><path d="M6 11.2c0-1.1 1.3-1.7 2.1-1L16 16.4l7.9-6.2c.9-.7 2.1-.1 2.1 1 0 .5-.2.9-.6 1.2l-7.2 5.7a3.6 3.6 0 0 1-4.4 0l-7.2-5.7c-.4-.3-.6-.7-.6-1.2Z" className={detail}/></>}
      {variant === "pencil" && <><path d="m6 23 2.2-7.2L21.5 2.5l8 8-13.3 13.3L9 26l-3-3Z" className={main}/><path d="m8.2 15.8 8 8-5.3 1.3-4-4 1.3-5.3ZM19.3 4.7l8 8-2.2 2.2-8-8 2.2-2.2Z" className={detail}/></>}
      {variant === "eraser" && <><path d="M5.4 19.2 17.2 7.4a4 4 0 0 1 5.6 0l2.8 2.8a4 4 0 0 1 0 5.6L15.4 26H9.2l-3.8-3.8a2.1 2.1 0 0 1 0-3Z" className={main}/><path d="m10.6 14 7.4 7.4-4.2 4.1H9.5l-3.2-3.2a1.7 1.7 0 0 1 0-2.4l4.3-5.9Z" className={detail}/></>}
      {variant === "book" && <><rect x="4" y="13" width="24" height="16" rx="5" className={main}/><rect x="7" y="9" width="17" height="9" rx="3.5" className={main}/><rect x="22" y="2" width="5" height="15" rx="2.5" transform="rotate(-12 22 2)" className={main}/><rect x="9" y="12" width="12" height="3" rx="1.5" className={detail}/><circle cx="9" cy="23" r="1.5" className={detail}/><circle cx="13.5" cy="23" r="1.5" className={detail}/><circle cx="18" cy="23" r="1.5" className={detail}/><circle cx="22.5" cy="23" r="1.5" className={detail}/></>}
      {variant === "pen" && <><path d="M7 25 9.5 16 22 3.5l6.5 6.5L16 22.5 7 25Z" className={main}/><path d="m9.5 16 6.5 6.5-4.2 1.2-3.5-3.5 1.2-4.2ZM20 5.5l6.5 6.5-2 2L18 7.5l2-2Z" className={detail}/></>}
      {variant === "magnet" && <><path d="M4 5h9v11a3 3 0 0 0 6 0V5h9v11a12 12 0 0 1-24 0V5Z" className={main}/><path d="M10 11h3v5a3 3 0 0 0 6 0v-5h3v5a6 6 0 0 1-12 0v-5Z" className={detail}/><rect x="4" y="5" width="9" height="6" rx="2.5" className={detail}/><rect x="19" y="5" width="9" height="6" rx="2.5" className={detail}/></>}
      {variant === "ruler" && <><path d="M4.8 19.2 19.2 4.8a4 4 0 0 1 5.6 0l2.4 2.4a4 4 0 0 1 0 5.6L12.8 27.2a4 4 0 0 1-5.6 0l-2.4-2.4a4 4 0 0 1 0-5.6Z" className={main}/><rect x="18.2" y="7.2" width="2.5" height="5" rx="1.25" transform="rotate(-45 18.2 7.2)" className={detail}/><rect x="14" y="11.4" width="2.5" height="4" rx="1.25" transform="rotate(-45 14 11.4)" className={detail}/><rect x="9.8" y="15.6" width="2.5" height="5" rx="1.25" transform="rotate(-45 9.8 15.6)" className={detail}/></>}
      {variant === "clip" && <path fillRule="evenodd" d="M21.8 3.3a7.2 7.2 0 0 1 5.1 12.3L14.7 27.8a5.8 5.8 0 0 1-8.2-8.2L17.4 8.7a4.2 4.2 0 1 1 5.9 5.9l-9.7 9.7-2.9-2.9 9.7-9.7a1.1 1.1 0 0 0-1.6-1.6L7.9 21a3.8 3.8 0 0 0 5.4 5.4l12.2-12.2a5.2 5.2 0 0 0-7.4-7.4L9.4 15.5l-2.9-2.9 8.7-8.7a7.2 7.2 0 0 1 6.6-.6Z" className={main}/>
      }
      {variant === "scissors" && <><path d="m14 14 14-8-2 6-9 5 9 5 2 6-14-8-4 4a5 5 0 1 1-3-3l4-4-4-4a5 5 0 1 1 3-3l4 4Z" className={main}/><circle cx="7" cy="9" r="2" className={detail}/><circle cx="7" cy="25" r="2" className={detail}/></>}
      {variant === "palette" && <><path d="M16 3C8.8 3 3 8.2 3 14.7 3 21 8 26 14.2 26H17a2.5 2.5 0 0 0 1.4-4.6 2.7 2.7 0 0 1 1.5-5h4.2c3 0 4.9-2.4 4.9-5C29 6.8 23.4 3 16 3Z" className={main}/><circle cx="10" cy="11" r="2" className={detail}/><circle cx="16" cy="8" r="2" className={detail}/><circle cx="22" cy="11" r="2" className={detail}/><circle cx="9" cy="17" r="2" className={detail}/></>}
      {variant === "lab" && <><path d="M11 3h10v3l-2 2v5l8 12a3 3 0 0 1-2.5 4h-17A3 3 0 0 1 5 25l8-12V8l-2-2V3Z" className={main}/><path d="M9 22h14l2.2 3.4c.4.7 0 1.6-.8 1.6H7.6c-.8 0-1.2-.9-.8-1.6L9 22Z" className={detail}/><circle cx="13" cy="20" r="1.5" className={detail}/></>}
      {variant === "shield" && <><path d="m16 2 12 5v8c0 7.5-5 12.5-12 15C9 27.5 4 22.5 4 15V7l12-5Z" className={main}/><path d="m10 16 4 4 8-9-3-2-5 6-2-2-2 3Z" className={detail}/></>}
      {variant === "box" && <><path d="m16 2 13 7-13 7L3 9l13-7Z" className={main}/><path d="M3 12.5 14 18v12L3 24.5v-12ZM29 12.5 18 18v12l11-5.5v-12Z" className={main}/><path d="m9 6 13 7-3 1.6L6 7.6 9 6Z" className={detail}/></>}
    </svg>
  );
}

