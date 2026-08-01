import { useRef, useEffect, useCallback } from 'react'

/**
 * useMagnetic — High-performance magnetic button hook
 * Caches bounding rect on mouse enter to avoid layout thrashing (getBoundingClientRect).
 * Uses lerped RAF loop for buttery smooth GPU-accelerated spring motion.
 */
export function useMagnetic(radius = 70, strength = 0.35) {
  const ref = useRef(null)
  const animRef = useRef(null)
  const rectRef = useRef(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  const lerp = (a, b, t) => a + (b - a) * t

  const animate = useCallback(() => {
    current.current.x = lerp(current.current.x, target.current.x, 0.14)
    current.current.y = lerp(current.current.y, target.current.y, 0.14)

    if (ref.current) {
      ref.current.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0)`
    }

    if (
      Math.abs(current.current.x - target.current.x) > 0.01 ||
      Math.abs(current.current.y - target.current.y) > 0.01
    ) {
      animRef.current = requestAnimationFrame(animate)
    } else {
      animRef.current = null
    }
  }, [])

  const onMouseEnter = useCallback(() => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect()
    }
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return
    if (!rectRef.current) {
      rectRef.current = ref.current.getBoundingClientRect()
    }

    const rect = rectRef.current
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const distSq = dx * dx + dy * dy

    if (distSq < radius * radius) {
      target.current.x = dx * strength
      target.current.y = dy * strength
    } else {
      target.current.x = 0
      target.current.y = 0
    }

    if (!animRef.current) {
      animRef.current = requestAnimationFrame(animate)
    }
  }, [radius, strength, animate])

  const onMouseLeave = useCallback(() => {
    rectRef.current = null
    target.current.x = 0
    target.current.y = 0
    if (!animRef.current) {
      animRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  return { ref, onMouseEnter, onMouseMove, onMouseLeave }
}
