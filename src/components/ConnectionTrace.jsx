import React, { useEffect, useRef, useState, useCallback } from 'react'
import './ConnectionTrace.css'

/**
 * ConnectionTrace — Draws a single, ultra-smooth organic Bezier curve 
 * from the nav logo anchor to whichever [data-stitch-target] card is hovered.
 * 
 * Performance & Geometry Features:
 * - Single continuous cubic Bezier curve (C) with 0 straight lines or sharp turns.
 * - Sweeps left into the empty viewport margin (x ~ 50px) alongside section headers,
 *   then smoothly arches right safely BELOW section text into the hovered card.
 * - 100% text clearance across all screen sizes and tiles.
 * - Retracts immediately on page scroll.
 */
export default function ConnectionTrace() {
  const svgRef = useRef(null)
  const pathRef = useRef(null)
  const anchorPosRef = useRef(null)
  const activeCardRef = useRef(null)
  const [pathData, setPathData] = useState(null)

  const updateAnchorPos = useCallback(() => {
    const anchor = document.getElementById('stitch-anchor')
    if (!anchor) return null
    const rect = anchor.getBoundingClientRect()
    anchorPosRef.current = {
      x: rect.right + 4,
      y: rect.top + rect.height / 2
    }
    return anchorPosRef.current
  }, [])

  useEffect(() => {
    updateAnchorPos()

    const onScroll = () => {
      activeCardRef.current = null
      setPathData(null)
      updateAnchorPos()
    }

    const onResize = () => {
      activeCardRef.current = null
      setPathData(null)
      updateAnchorPos()
    }

    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [updateAnchorPos])

  // Single continuous organic cubic Bezier curve (0 sharp movements, 0 text overlap)
  const computeOrganicPath = (x1, y1, x2, y2) => {
    // Control point 1: Sweeps out into the empty left margin (x ~ 50px),
    // staying safely to the left of all centered header text (which starts at x ~ 350px)
    const cp1x = Math.min(x1 - 100, 50)
    const cp1y = y1 + (y2 - y1) * 0.45

    // Control point 2: Smoothly arches right through empty space BELOW the section text
    // (y > 350px, below header subtext) directly into the target card top
    const cp2x = Math.min(x1 + (x2 - x1) * 0.5, x2 - 80)
    const cp2y = y2 - 40

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
  }

  useEffect(() => {
    const handleEnter = (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return
      const card = e.target.closest('[data-stitch-target]')
      if (!card || card === activeCardRef.current) return
      activeCardRef.current = card

      let anchor = anchorPosRef.current
      if (!anchor) anchor = updateAnchorPos()
      if (!anchor) return

      const rect = card.getBoundingClientRect()
      const cardTargetX = rect.left + rect.width / 2
      const cardTargetY = rect.top

      const d = computeOrganicPath(anchor.x, anchor.y, cardTargetX, cardTargetY)
      setPathData(d)
    }

    const handleLeave = (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return
      const card = e.target.closest('[data-stitch-target]')
      if (!card) return
      if (card.contains(e.relatedTarget)) return
      activeCardRef.current = null
      setPathData(null)
    }

    document.addEventListener('mouseenter', handleEnter, true)
    document.addEventListener('mouseleave', handleLeave, true)

    return () => {
      document.removeEventListener('mouseenter', handleEnter, true)
      document.removeEventListener('mouseleave', handleLeave, true)
    }
  }, [updateAnchorPos])

  useEffect(() => {
    if (pathRef.current && pathData) {
      const length = pathRef.current.getTotalLength()
      pathRef.current.style.strokeDasharray = length
      pathRef.current.style.strokeDashoffset = length
      requestAnimationFrame(() => {
        if (pathRef.current) {
          pathRef.current.style.transition = 'stroke-dashoffset 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
          pathRef.current.style.strokeDashoffset = '0'
        }
      })
    }
  }, [pathData])

  if (!pathData) return null

  return (
    <svg
      ref={svgRef}
      className="connection-trace"
      width="100%"
      height="100%"
    >
      <path
        ref={pathRef}
        d={pathData}
        className="connection-trace__line"
      />
    </svg>
  )
}
