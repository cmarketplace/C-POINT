'use client'

import { useEffect, useId, useRef } from 'react'

interface RadialSparkMotifProps {
  className?: string
  size?: number
  baseRotation?: number
}

/**
 * 8-Stroke Radial Burst Spark Motif.
 *
 * SPEC:
 * - Exactly 8 radial line strokes of identical short length
 * - Rounded line caps
 * - Uniform 7px stroke weight
 * - Clean geometric circular burst with no center circle
 * - C-Market gradient: deep blue (#573ec9) -> cyan (#8b74ee) -> turquoise (#34e8a5)
 * - Opacity: 40%
 * - Subtle scroll-linked motion: max 3–5° rotation, scale 0.96 -> 1
 */
export default function RadialSparkMotif({
  className = '',
  size = 120,
  baseRotation = 0,
}: RadialSparkMotifProps) {
  const rawId = useId()
  const gradientId = `spark-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const containerRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<SVGGElement>(null)

  // 8 radial strokes from center (80, 80)
  // All 8 strokes have the exact same inner radius (20px) and outer radius (44px) -> length 24px
  const cx = 80
  const cy = 80
  const rIn = 20
  const rOut = 44

  const angles = [0, 45, 90, 135, 180, 225, 270, 315]
  const baseStrokes = angles.map(deg => {
    const rad = (deg * Math.PI) / 180
    const x1 = cx + rIn * Math.cos(rad)
    const y1 = cy + rIn * Math.sin(rad)
    const x2 = cx + rOut * Math.cos(rad)
    const y2 = cy + rOut * Math.sin(rad)

    return { deg, x1, y1, x2, y2 }
  })

  useEffect(() => {
    let rafId: number | null = null

    const updateScrollMotion = () => {
      if (!containerRef.current || !groupRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // If near viewport
      if (rect.bottom >= -100 && rect.top <= windowHeight + 100) {
        // Normalize scroll progress 0 (entering from bottom) to 1 (leaving top)
        const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)))

        // Scroll-linked rotation: max 3-5 deg
        const rotOffset = (progress - 0.5) * 8 // -4deg to +4deg
        const currentRot = baseRotation + rotOffset

        // Scale: 0.96 to 1.0 (peaks at center of viewport)
        const centerFactor = 1 - Math.abs(progress - 0.5) * 2 // 0 at edges, 1 at center
        const scale = 0.96 + 0.04 * centerFactor

        groupRef.current.style.transform = `rotate(${currentRot.toFixed(2)}deg) scale(${scale.toFixed(3)})`
      }

      rafId = null
    }

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateScrollMotion)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateScrollMotion()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [baseRotation])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none select-none z-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full opacity-40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* C-Market Brand Gradient with userSpaceOnUse */}
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="25"
            y1="135"
            x2="135"
            y2="25"
          >
            <stop offset="0%" stopColor="#573ec9" />
            <stop offset="50%" stopColor="#8b74ee" />
            <stop offset="100%" stopColor="#34e8a5" />
          </linearGradient>
        </defs>

        <g
          ref={groupRef}
          className="will-change-transform"
          style={{ transformOrigin: '80px 80px' }}
        >
          {baseStrokes.map((stroke, index) => (
            <line
              key={index}
              x1={stroke.x1.toFixed(2)}
              y1={stroke.y1.toFixed(2)}
              x2={stroke.x2.toFixed(2)}
              y2={stroke.y2.toFixed(2)}
              stroke={`url(#${gradientId})`}
              strokeWidth="7"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
