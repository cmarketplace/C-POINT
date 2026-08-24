#!/usr/bin/env node
/**
 * 랜딩 숫자 스냅샷 갱신기.
 *
 * 랜딩의 「N품목 · N분류」는 **빌드 때 세지 않는다.** KCL 몰이 그렇게 했다가 승인 품목이
 * 18,000건이 된 뒤로 200건씩 90쪽을 순차로 받아야 했고, Next 의 정적 생성 워커 한도
 * (60초)를 넘겨 운영 배포를 통째로 죽였다. 그래서 여기서 미리 세어
 * `src/data/landing-stats.json` 에 박아 두고, 랜딩은 그 파일만 읽는다.
 *
 *   npm run landing:stats                              # 배포된 몰에서 세어 파일을 덮어쓴다
 *   npm run landing:stats -- --dry                     # 세기만 하고 파일은 그대로
 *   npm run landing:stats -- --base http://localhost:3000
 *
 * ── 왜 세모 피드를 직접 안 부르나
 * 피드는 파트너 API 키를 요구하는데 그 키는 서버에만 있다. 몰의 `/api/shop/*` 는 그 키를
 * 쥔 서버가 대신 불러 주는 창구라, 이걸 쓰면 숫자를 갱신하려고 키를 사람 손에 돌릴
 * 이유가 없어진다.
 *
 * ── 카테고리 인덱스 한 번이면 끝난다
 * 세모가 대분류·소분류별 건수를 인덱스로 내려준다. 품목을 전량 훑을 이유가 없다.
 */

import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = resolve(ROOT, 'src/data/landing-stats.json')

const DEFAULT_BASE = 'http://localhost:3000'
const TIMEOUT_MS = 30_000

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function get(base, path) {
  const url = new URL(path, base)
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`${url.pathname} -> HTTP ${response.status}`)

  // 라우트가 아직 배포 전이면 Next 가 404 페이지(HTML)를 200 으로 주는 경우가 있다.
  const type = response.headers.get('content-type') || ''
  if (!type.includes('json')) {
    throw new Error(`${url.pathname} 이 JSON 을 주지 않았습니다 — 아직 배포되지 않은 듯합니다`)
  }
  return response.json()
}

async function main() {
  const dryRun = process.argv.includes('--dry')
  const base = argValue('--base') || DEFAULT_BASE

  console.log(`출처: ${base}`)

  const index = await get(base, '/api/shop/categories')
  const groups = index?.groups ?? []

  const countsByRoot = {}
  let itemCount = 0
  const leafNames = new Set()

  for (const group of groups) {
    const rootName = (group.rootCategoryName || '').trim() || '기타'
    const count = Number(group.itemCount) || 0

    countsByRoot[rootName] = (countsByRoot[rootName] ?? 0) + count
    itemCount += count

    for (const child of group.children ?? []) {
      const name = (child.categoryName || '').trim()
      if (name) leafNames.add(name)
    }
  }

  const snapshot = {
    // 이 파일이 «언제 잰 숫자» 인지가 숫자 자체만큼 중요하다. 랜딩이 「기준일」로 그대로 쓴다.
    measuredAt: new Date().toISOString().slice(0, 10),
    source: base,
    itemCount,
    categoryCount: leafNames.size,
    rootCount: Object.keys(countsByRoot).length,
    // 건수 내림차순으로 적어 다음 갱신의 diff 를 사람이 읽을 수 있게 둔다.
    countsByRoot: Object.fromEntries(
      Object.entries(countsByRoot).sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'),
      ),
    ),
  }

  console.log(
    `품목 ${snapshot.itemCount.toLocaleString('ko-KR')} · ` +
      `대분류 ${snapshot.rootCount} · 소분류 ${snapshot.categoryCount}`,
  )

  if (itemCount === 0) {
    // 실패가 아니다 — 세모가 이 몰에 아직 품목을 승인하지 않은 상태다.
    // 0 을 그대로 기록하면 `getLandingStats()` 가 null 을 주고 랜딩은 숫자 블록을 비운다.
    console.warn('승인된 품목이 0건입니다 — 랜딩의 숫자 블록은 그려지지 않습니다.')
  }

  if (dryRun) {
    console.log('--dry: 파일은 건드리지 않았습니다.')
    return
  }

  writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  console.log(`기록: ${OUTPUT}`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
