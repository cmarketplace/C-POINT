'use client'

import { useEffect, useRef } from 'react'

/**
 * Section 04 (ClosingCTA) 전용 사선 배경.
 *
 * VISUAL SPEC:
 * - Direction: bottom-left → top-right (~45°)
 * - C-Market gradient: deep blue (#573ec9) → cyan (#8b74ee) → turquoise (#34e8a5)
 * - Uniform line weight: 7px with rounded caps on all strokes
 * - Perfectly balanced symmetrical layout: equal count and spacing between left and right flanks
 * - Opacity: 45–60% with large central negative space / clear-zone protection
 * - Motion: 3 parallax speed layers reacting to scroll via requestAnimationFrame & translate3d
 * - Occasional rare cyan energy spark gliding along one line
 */
export default function DiagonalLinesBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const layer1Ref = useRef<SVGGElement>(null)
  const layer2Ref = useRef<SVGGElement>(null)
  const layer3Ref = useRef<SVGGElement>(null)

  useEffect(() => {
    let rafId: number | null = null

    const updateParallax = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      if (rect.bottom >= -200 && rect.top <= windowHeight + 200) {
        const relativeScroll = -rect.top

        // Parallax speed factors (subtle, smooth, 45-degree upward-right: dx = offset, dy = -offset)
        const speed1 = 0.08
        const speed2 = 0.16
        const speed3 = 0.24

        if (layer1Ref.current) {
          const d1 = relativeScroll * speed1 * 0.7071
          layer1Ref.current.style.transform = `translate3d(${d1.toFixed(1)}px, ${(-d1).toFixed(1)}px, 0)`
        }
        if (layer2Ref.current) {
          const d2 = relativeScroll * speed2 * 0.7071
          layer2Ref.current.style.transform = `translate3d(${d2.toFixed(1)}px, ${(-d2).toFixed(1)}px, 0)`
        }
        if (layer3Ref.current) {
          const d3 = relativeScroll * speed3 * 0.7071
          layer3Ref.current.style.transform = `translate3d(${d3.toFixed(1)}px, ${(-d3).toFixed(1)}px, 0)`
        }
      }

      rafId = null
    }

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateParallax)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateParallax()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        maskImage:
          'radial-gradient(ellipse 70% 65% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,1) 100%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 70% 65% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,1) 100%)',
      }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1600 750"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* C-Market Brand Gradient (Bottom-Left: #573ec9 -> Cyan: #8b74ee -> Turquoise: #34e8a5) */}
          <linearGradient id="cm-diag-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#573ec9" />
            <stop offset="50%" stopColor="#8b74ee" />
            <stop offset="100%" stopColor="#34e8a5" />
          </linearGradient>

          {/* Spark Glow Gradient */}
          <linearGradient id="cm-spark-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b74ee" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#34e8a5" stopOpacity="0" />
          </linearGradient>

          <style>{`
            @keyframes cmarketSparkPulse {
              0% {
                stroke-dashoffset: 350;
                opacity: 0;
              }
              2% {
                opacity: 0.95;
              }
              12% {
                stroke-dashoffset: -90;
                opacity: 0.95;
              }
              15% {
                stroke-dashoffset: -90;
                opacity: 0;
              }
              100% {
                stroke-dashoffset: -90;
                opacity: 0;
              }
            }
            .cmarket-spark {
              stroke-dasharray: 60 300;
              animation: cmarketSparkPulse 13s cubic-bezier(0.25, 1, 0.5, 1) infinite;
            }
          `}</style>
        </defs>

        {/* =========================================================================
            Layer 1 (Slow Parallax Speed ~0.08) - Uniform 7px Stroke Base
           ========================================================================= */}
        <g ref={layer1Ref} className="will-change-transform">
          {/* Left flank: 1 line */}
          <line
            x1="-40"
            y1="380"
            x2="280"
            y2="60"
            stroke="url(#cm-diag-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />

          {/* Right flank: 1 line (symmetrical count & distance) */}
          <line
            x1="1320"
            y1="380"
            x2="1640"
            y2="60"
            stroke="url(#cm-diag-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
        </g>

        {/* =========================================================================
            Layer 2 (Medium Parallax Speed ~0.16) - Uniform 7px Stroke Mid-depth
           ========================================================================= */}
        <g ref={layer2Ref} className="will-change-transform">
          {/* Left flank: 1 line */}
          <line
            x1="80"
            y1="520"
            x2="380"
            y2="220"
            stroke="url(#cm-diag-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeOpacity="0.52"
          />

          {/* Right flank: 1 line (symmetrical count & distance) */}
          <line
            x1="1220"
            y1="520"
            x2="1520"
            y2="220"
            stroke="url(#cm-diag-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeOpacity="0.52"
          />
        </g>

        {/* =========================================================================
            Layer 3 (Foreground Speed ~0.24) - Uniform 7px Stroke Accents
           ========================================================================= */}
        <g ref={layer3Ref} className="will-change-transform">
          {/* Left flank: 1 line */}
          <line
            x1="20"
            y1="240"
            x2="220"
            y2="40"
            stroke="url(#cm-diag-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeOpacity="0.58"
          />

          {/* Right flank: 1 line (symmetrical count & distance) */}
          <line
            x1="1380"
            y1="240"
            x2="1580"
            y2="40"
            stroke="url(#cm-diag-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeOpacity="0.58"
          />
          {/* Rare Cyan Energy Spark along right flank line */}
          <line
            x1="1380"
            y1="240"
            x2="1580"
            y2="40"
            stroke="url(#cm-spark-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            className="cmarket-spark"
          />
        </g>
      </svg>
    </div>
  )
}
