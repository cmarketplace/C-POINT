/**
 * 세모 API 접속 설정 — 피드와 주문·포인트가 **같은 값**을 쓰게 하는 자리.
 * (KCL 몰 `semo-api.ts` 와 같은 구조 — 한쪽만 slug 를 바꾸는 사고를 막는다.)
 *
 * **서버 전용이다.** 파트너 키는 이 쇼핑몰 전용이 아니라 씨마켓 연동 전체가 쓰는 키라
 * 클라이언트 번들에 들어가면 소스보기로 그대로 새 나간다(`NEXT_PUBLIC_` 접두사 금지).
 */

const DEFAULT_SLUG = 'c-point'

export class SemoApiConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SemoApiConfigError'
  }
}

export interface SemoApiConfig {
  /** 끝의 슬래시를 뗀 base. 예) `https://api.semo.io.kr/api/v1` */
  base: string
  apiKey: string
  slug: string
}

/**
 * 주문을 세모로 보낼 수 있는 설정인가.
 *
 * 아니면 로컬 스텁 원장이 자리를 지킨다(`orders.ts`) — 키 없이 배포된 환경에서
 * 주문 버튼이 500 을 던지는 것보다, 스텁임이 명시된 채 도는 편이 낫다.
 */
export function isSemoConfigured(): boolean {
  return Boolean(process.env.SEMO_API_BASE?.trim() && process.env.SEMO_API_KEY?.trim())
}

export function resolveSemoApi(): SemoApiConfig {
  const base = process.env.SEMO_API_BASE
  const apiKey = process.env.SEMO_API_KEY

  if (!base || !apiKey) {
    throw new SemoApiConfigError('SEMO_API_BASE / SEMO_API_KEY 가 설정되지 않았습니다')
  }

  return {
    base: base.replace(/\/$/, ''),
    apiKey,
    slug: process.env.STOREFRONT_SLUG || DEFAULT_SLUG,
  }
}

/** 쇼핑몰 단위 경로를 만든다. slug 에 특수문자가 와도 안전하게 인코딩한다. */
export function storefrontUrl(config: SemoApiConfig, path: string): string {
  return `${config.base}/external/storefronts/${encodeURIComponent(config.slug)}${path}`
}
