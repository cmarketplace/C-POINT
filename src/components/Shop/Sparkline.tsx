interface SparklineProps {
  values: readonly number[]
  width?: number
  height?: number
  className?: string
  label?: string
}

/**
 * 6개월 단가 추이 — 작은 선 하나와 끝점.
 *
 * 축·눈금은 없다. 이 그림이 답하는 질문은 «올랐나 내렸나 흔들리나» 하나뿐이고, 값 자체는
 * 옆 칸의 단가가 말한다. 색은 currentColor 라 부모의 텍스트 색을 그대로 따른다.
 */
export default function Sparkline({
  values,
  width = 84,
  height = 24,
  className = '',
  label,
}: SparklineProps) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 3

  const points = values.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / (values.length - 1)
    const y = height - pad - ((value - min) / span) * (height - pad * 2)
    return [x, y] as const
  })
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill="currentColor" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}
