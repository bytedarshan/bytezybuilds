import React, { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useMagnetic } from '../hooks/useMagnetic'
import { useContent } from '../context/ContentContext'
import ProductStageScene from './ProductStage3D'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

/* ── Hero Section ────────────────────────────────── */
export default function Hero() {
  const { siteCopy } = useContent()
  const sectionRef   = useRef()
  const textRef      = useRef()
  const subRef       = useRef()
  const btnRef       = useRef()
  const badgesRef    = useRef()
  const mousePos     = useRef({ x: 0, y: 0 })
  const magnetic     = useMagnetic(70, 0.3)
  const [isVisible, setIsVisible] = useState(true)
  const scrollProgress = useRef(0)
  const heroContentRef = useRef()

  const xTextTo = useRef(null)
  const yTextTo = useRef(null)
  const xSubTo  = useRef(null)
  const ySubTo  = useRef(null)
  const xBtnTo  = useRef(null)
  const yBtnTo  = useRef(null)

  useEffect(() => {
    /* IntersectionObserver – pause GPU when off-screen */
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)

    if (textRef.current) {
      xTextTo.current = gsap.quickTo(textRef.current, 'x', { duration: 0.6, ease: 'power2.out' })
      yTextTo.current = gsap.quickTo(textRef.current, 'y', { duration: 0.6, ease: 'power2.out' })
    }
    if (subRef.current) {
      xSubTo.current = gsap.quickTo(subRef.current, 'x', { duration: 0.6, ease: 'power2.out' })
      ySubTo.current = gsap.quickTo(subRef.current, 'y', { duration: 0.6, ease: 'power2.out' })
    }
    if (btnRef.current) {
      xBtnTo.current = gsap.quickTo(btnRef.current, 'x', { duration: 0.6, ease: 'power2.out' })
      yBtnTo.current = gsap.quickTo(btnRef.current, 'y', { duration: 0.6, ease: 'power2.out' })
    }

    gsap.fromTo(textRef.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', delay: 0.3 }
    )
    gsap.fromTo(subRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.7 }
    )
    gsap.fromTo(btnRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 1.1 }
    )
    gsap.fromTo(badgesRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 1.3 }
    )

    // Pin & scrub ScrollTrigger for 3D Hero Scrollytelling
    const isMobile = window.innerWidth <= 768
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: isMobile ? '+=80%' : '+=130%',
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress
        scrollProgress.current = p

        // Fade hero text content as 3D architecture stack unfolds
        if (heroContentRef.current) {
          const fadeP = Math.min(p / 0.45, 1)
          heroContentRef.current.style.opacity = 1 - fadeP
          heroContentRef.current.style.transform = `translateY(${-fadeP * 50}px) scale(${1 - fadeP * 0.08})`
          heroContentRef.current.style.pointerEvents = p > 0.4 ? 'none' : 'auto'
        }
      }
    })

    return () => {
      st.kill()
      observer.disconnect()
    }
  }, [])

  const handlePointerMove = (clientX, clientY) => {
    const x = (clientX / window.innerWidth  - 0.5) * 2
    const y = -(clientY / window.innerHeight - 0.5) * 2
    mousePos.current.x = x
    mousePos.current.y = y

    if (xTextTo.current) {
      xTextTo.current(x * 25)
      yTextTo.current(-y * 25)
    }
    if (xSubTo.current) {
      xSubTo.current(x * 15)
      ySubTo.current(-y * 15)
    }
    if (xBtnTo.current) {
      xBtnTo.current(x * 8)
      yBtnTo.current(-y * 8)
    }
  }

  const onMouseMove = (e) => handlePointerMove(e.clientX, e.clientY)
  
  const onTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  return (
    <section id="hero" className="hero" ref={sectionRef} onMouseMove={onMouseMove} onTouchMove={onTouchMove}>
      <div className="hero__canvas">
        <Canvas
          camera={{ position: [0, 1, 5.5], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          frameloop={isVisible ? 'always' : 'never'}
        >
          <Suspense fallback={null}>
            <ProductStageScene mousePos={mousePos} scrollProgress={scrollProgress} />
          </Suspense>
        </Canvas>
      </div>

      <div className="hero__overlay" />

      <div className="hero__content" ref={heroContentRef}>
        <div className="hero__status">
          <span className="hero__status-dot" />
          {siteCopy.heroStatus}
        </div>

        <h1 className="hero__title" ref={textRef}>
          <span className="hero__title-line">{siteCopy.heroTitle1}</span>
          <span className="hero__title-line hero__title-line--accent">{siteCopy.heroTitleAccent}</span>
          <span className="hero__byline">
            {siteCopy.heroByline}
          </span>
        </h1>

        <p className="hero__sub" ref={subRef}>
          {siteCopy.heroSub}
        </p>

        <div className="hero__actions" ref={btnRef}>
          <div
            onMouseEnter={magnetic.onMouseEnter}
            onMouseMove={magnetic.onMouseMove}
            onMouseLeave={magnetic.onMouseLeave}
            style={{ display: 'inline-flex' }}
          >
            <a href="#deploy" className="btn-glow" ref={magnetic.ref}>
              {siteCopy.heroCta}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
          <a href="#portfolio" className="hero__ghost-btn">
            {siteCopy.heroGhostCta}
          </a>
        </div>

        <div className="hero__badges" ref={badgesRef}>
          {['React JS', 'Node.js', 'Three.js', 'WebGL', 'GSAP'].map(t => (
            <span key={t} className="hero__badge">{t}</span>
          ))}
        </div>
      </div>

      <div className="hero__scroll">
        <div className="hero__scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  )
}
