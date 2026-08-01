import React, { useEffect, useRef } from 'react'

const style = {
  cursor: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(225,172,244,0.85) 0%, rgba(38,26,177,0.5) 60%, transparent 100%)',
    boxShadow: '0 0 16px rgba(225,172,244,0.35)',
    pointerEvents: 'none',
    zIndex: 100000,
    willChange: 'transform, width, height',
    transition: 'width 0.25s ease-out, height 0.25s ease-out, background 0.25s ease-out',
  },
  trail1: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'rgba(225,172,244,0.35)',
    pointerEvents: 'none',
    zIndex: 99999,
    willChange: 'transform',
  },
  trail2: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'rgba(38,26,177,0.4)',
    pointerEvents: 'none',
    zIndex: 99998,
    willChange: 'transform',
  }
}

export default function CustomCursor() {
  const cursorRef = useRef(null)
  const trail1Ref = useRef(null)
  const trail2Ref = useRef(null)
  const pos = useRef({ x: -100, y: -100 })
  const trail1Pos = useRef({ x: -100, y: -100 })
  const trail2Pos = useRef({ x: -100, y: -100 })
  const rafRef = useRef(null)
  const isHovered = useRef(false)

  useEffect(() => {
    // Only update ref, no DOM touch in event listener
    const onMove = (e) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY
    }

    const animate = () => {
      const x = pos.current.x
      const y = pos.current.y

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x - (isHovered.current ? 24 : 12)}px, ${y - (isHovered.current ? 24 : 12)}px, 0)`
      }

      if (trail1Ref.current) {
        trail1Pos.current.x += (x - trail1Pos.current.x) * 0.22
        trail1Pos.current.y += (y - trail1Pos.current.y) * 0.22
        trail1Ref.current.style.transform = `translate3d(${trail1Pos.current.x - 5}px, ${trail1Pos.current.y - 5}px, 0)`
      }

      if (trail2Ref.current) {
        trail2Pos.current.x += (trail1Pos.current.x - trail2Pos.current.x) * 0.3
        trail2Pos.current.y += (trail1Pos.current.y - trail2Pos.current.y) * 0.3
        trail2Ref.current.style.transform = `translate3d(${trail2Pos.current.x - 2.5}px, ${trail2Pos.current.y - 2.5}px, 0)`
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    const setHoverState = (hovering) => {
      if (isHovered.current === hovering) return
      isHovered.current = hovering
      if (cursorRef.current) {
        if (hovering) {
          cursorRef.current.style.width  = '48px'
          cursorRef.current.style.height = '48px'
          cursorRef.current.style.background = 'radial-gradient(circle, rgba(225,172,244,0.9) 0%, rgba(38,26,177,0.6) 60%, transparent 100%)'
          cursorRef.current.style.boxShadow  = '0 0 24px rgba(225,172,244,0.45)'
        } else {
          cursorRef.current.style.width  = '24px'
          cursorRef.current.style.height = '24px'
          cursorRef.current.style.background = 'radial-gradient(circle, rgba(225,172,244,0.85) 0%, rgba(38,26,177,0.5) 60%, transparent 100%)'
          cursorRef.current.style.boxShadow  = '0 0 16px rgba(225,172,244,0.35)'
        }
      }
    }

    const onMouseOver = (e) => {
      const t = e.target
      if (t && t.closest && t.closest('a, button, [data-cursor], input, textarea, select')) {
        setHoverState(true)
      } else {
        setHoverState(false)
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onMouseOver, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onMouseOver)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} style={style.cursor} />
      <div ref={trail1Ref} style={style.trail1} />
      <div ref={trail2Ref} style={style.trail2} />
    </>
  )
}
