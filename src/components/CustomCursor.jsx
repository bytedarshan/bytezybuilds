import React, { useEffect, useRef } from 'react'

const style = {
  cursor: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(225,172,244,0.95) 0%, rgba(38,26,177,0.6) 40%, transparent 80%)',
    boxShadow: '0 0 25px rgba(225,172,244,0.7), 0 0 50px rgba(38,26,177,0.4)',
    pointerEvents: 'none',
    zIndex: 100000,
    transform: 'translate(-50%, -50%) scale(1)',
    transition: 'width 0.3s ease, height 0.3s ease, background 0.3s ease, transform 0.15s ease',
    mixBlendMode: 'screen',
  },
  trail1: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'rgba(225,172,244,0.5)',
    boxShadow: '0 0 10px rgba(225,172,244,0.3)',
    pointerEvents: 'none',
    zIndex: 99999,
    transform: 'translate(-50%, -50%)',
    transition: 'all 0.1s ease',
  },
  trail2: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'rgba(38,26,177,0.6)',
    pointerEvents: 'none',
    zIndex: 99998,
    transform: 'translate(-50%, -50%)',
    transition: 'all 0.08s ease',
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

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top  = e.clientY + 'px'
      }
    }

    const animate = () => {
      if (trail1Ref.current) {
        trail1Pos.current.x += (pos.current.x - trail1Pos.current.x) * 0.18
        trail1Pos.current.y += (pos.current.y - trail1Pos.current.y) * 0.18
        trail1Ref.current.style.left = trail1Pos.current.x + 'px'
        trail1Ref.current.style.top  = trail1Pos.current.y + 'px'
      }
      if (trail2Ref.current) {
        trail2Pos.current.x += (trail1Pos.current.x - trail2Pos.current.x) * 0.25
        trail2Pos.current.y += (trail1Pos.current.y - trail2Pos.current.y) * 0.25
        trail2Ref.current.style.left = trail2Pos.current.x + 'px'
        trail2Ref.current.style.top  = trail2Pos.current.y + 'px'
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    const onHoverIn = () => {
      if (cursorRef.current) {
        cursorRef.current.style.width  = '56px'
        cursorRef.current.style.height = '56px'
        cursorRef.current.style.background = 'radial-gradient(circle, rgba(225,172,244,1) 0%, rgba(38,26,177,0.8) 60%, transparent 80%)'
        cursorRef.current.style.boxShadow  = '0 0 40px rgba(225,172,244,0.9), 0 0 80px rgba(38,26,177,0.6)'
      }
    }
    const onHoverOut = () => {
      if (cursorRef.current) {
        cursorRef.current.style.width  = '28px'
        cursorRef.current.style.height = '28px'
        cursorRef.current.style.background = 'radial-gradient(circle, rgba(225,172,244,0.95) 0%, rgba(38,26,177,0.6) 40%, transparent 80%)'
        cursorRef.current.style.boxShadow  = '0 0 25px rgba(225,172,244,0.7), 0 0 50px rgba(38,26,177,0.4)'
      }
    }
    const onClickDown = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'translate(-50%, -50%) scale(0.7)'
    }
    const onClickUp = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
    }

    const interactives = document.querySelectorAll('a, button, [data-cursor], input, textarea, select')
    interactives.forEach(el => {
      el.addEventListener('mouseenter', onHoverIn)
      el.addEventListener('mouseleave', onHoverOut)
    })

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onClickDown)
    window.addEventListener('mouseup', onClickUp)
    
    document.addEventListener('mouseover', (e) => {
      const t = e.target
      if (t.closest('a, button, [data-cursor], input, textarea, select')) onHoverIn()
      else onHoverOut()
    })

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onClickDown)
      window.removeEventListener('mouseup', onClickUp)
      cancelAnimationFrame(rafRef.current)
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
