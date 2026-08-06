import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useContent } from '../context/ContentContext'
import mkcScreenshot from '../assets/mkc-screenshot.png'
import './PortfolioReveal.css'

gsap.registerPlugin(ScrollTrigger)

/* ── Easing helpers ───────────────────────────────── */
// Attempt to detect reduced motion preference
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── Progress-to-animation mapping ────────────────── 
 *
 *  progress 0.00 → 0.35  MACRO REVEAL
 *    scale:    1.8 → 1.0
 *    rotateX:  12° → 5°
 *    rotateY: -18° → -8°
 *    screenshot visible from start (macro close-up)
 *    frame opacity: 0 → 1 (starts at 0.10, ends at 0.35)
 *
 *  progress 0.35 → 0.60  FULL REVEAL + ORBIT SETTLE
 *    scale settles at 1.0
 *    rotateX: 5° → 3°  (subtle settle)
 *    rotateY: -8° → -5° (subtle settle)
 *    shadow depth increases
 *
 *  progress 0.60 → 0.80  BACKGROUND CROSSFADE
 *    backdrop opacity: 0 → 1
 *    spotlight fades in behind device
 *
 *  progress 0.80 → 1.00  TEXT LANDING
 *    text opacity: 0 → 1
 *    text translateY: 24px → 0
 *    At ~0.98 the pin releases
 */

function mapProgress(progress) {
  // Clamp helper
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
  const remap = (v, inMin, inMax, outMin, outMax) =>
    outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin)

  // Smooth easing curve (ease-out cubic)
  const easeOut = (t) => 1 - Math.pow(1 - t, 3)

  // Phase 1: Macro reveal (0 → 0.35)
  const macroT = easeOut(remap(progress, 0, 0.35, 0, 1))
  const scale = 1.8 - macroT * 0.8   // 1.8 → 1.0
  const rotateX = 12 - macroT * 7    // 12° → 5°
  const rotateY = -18 + macroT * 10  // -18° → -8°

  // Phase 2: Orbit settle (0.35 → 0.60)
  const settleT = easeOut(remap(progress, 0.35, 0.60, 0, 1))
  const finalRotateX = 5 - settleT * 2    // 5° → 3°
  const finalRotateY = -8 + settleT * 3   // -8° → -5°
  const finalScale = 1.0

  // Blend phases
  const useSettle = progress > 0.35
  const currentScale = useSettle ? finalScale : scale
  const currentRotateX = useSettle ? finalRotateX : rotateX
  const currentRotateY = useSettle ? finalRotateY : rotateY

  // Frame opacity (bezel, base, hinge) — appears during 0.10 → 0.30
  const frameOpacity = easeOut(remap(progress, 0.10, 0.30, 0, 1))

  // Phase 3: Background crossfade (0.60 → 0.80)
  const backdropOpacity = easeOut(remap(progress, 0.60, 0.80, 0, 1))

  // Phase 4: Text landing (0.80 → 1.00)
  const textOpacity = easeOut(remap(progress, 0.80, 0.98, 0, 1))

  return {
    scale: currentScale,
    rotateX: currentRotateX,
    rotateY: currentRotateY,
    frameOpacity,
    backdropOpacity,
    textOpacity,
  }
}

/* ── PortfolioReveal Component ────────────────────── */
export default function PortfolioReveal() {
  const { projects } = useContent()
  const containerRef = useRef()
  const deviceRef = useRef()
  const screenWrapRef = useRef()
  const baseRef = useRef()
  const hingeRef = useRef()
  const backdropRef = useRef()
  const spotlightRef = useRef()
  const contentRef = useRef()
  const scrollHintRef = useRef()

  // Find the MKC project (p2) from content
  const flagship = projects.find(p => p.id === 'p2') || projects[1] || projects[0]

  useEffect(() => {
    if (prefersReducedMotion()) return

    const container = containerRef.current
    if (!container) return

    // Determine mobile vs desktop scroll distance
    const isMobile = window.innerWidth <= 768

    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: isMobile ? '+=100%' : '+=150%',
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress
        const values = mapProgress(p)

        // Update CSS custom properties on the container
        const el = container

        // Device transform
        if (deviceRef.current) {
          deviceRef.current.style.setProperty('--reveal-scale', values.scale)
          deviceRef.current.style.setProperty('--reveal-rotateX', `${values.rotateX}deg`)
          deviceRef.current.style.setProperty('--reveal-rotateY', `${values.rotateY}deg`)
        }

        // Frame opacity (bezel, base, hinge)
        if (screenWrapRef.current) {
          screenWrapRef.current.style.setProperty('--reveal-frame-opacity', values.frameOpacity)
        }
        if (baseRef.current) {
          baseRef.current.style.setProperty('--reveal-frame-opacity', values.frameOpacity)
        }
        if (hingeRef.current) {
          hingeRef.current.style.setProperty('--reveal-frame-opacity', values.frameOpacity)
        }

        // Background crossfade
        if (backdropRef.current) {
          backdropRef.current.style.setProperty('--reveal-backdrop-opacity', values.backdropOpacity)
        }
        if (spotlightRef.current) {
          spotlightRef.current.style.setProperty('--reveal-backdrop-opacity', values.backdropOpacity)
        }

        // Text landing
        if (contentRef.current) {
          contentRef.current.style.setProperty('--reveal-text-opacity', values.textOpacity)
        }

        // Scroll hint fades out as text appears
        if (scrollHintRef.current) {
          scrollHintRef.current.style.setProperty('--reveal-text-opacity', values.textOpacity)
        }
      }
    })

    // Refresh on resize
    const handleResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', handleResize)

    return () => {
      st.kill()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="portfolio-reveal" ref={containerRef}>
      {/* Background crossfade layers */}
      <div className="portfolio-reveal__backdrop" ref={backdropRef} />
      <div className="portfolio-reveal__spotlight" ref={spotlightRef} />

      {/* 3D Stage */}
      <div className="portfolio-reveal__stage">
        {/* Device frame with CSS 3D transforms */}
        <div className="portfolio-reveal__device" ref={deviceRef}>
          {/* Laptop screen housing */}
          <div className="portfolio-reveal__screen-wrap" ref={screenWrapRef}>
            {/* Browser chrome */}
            <div className="portfolio-reveal__browser-bar">
              <span className="portfolio-reveal__browser-dot portfolio-reveal__browser-dot--red" />
              <span className="portfolio-reveal__browser-dot portfolio-reveal__browser-dot--yellow" />
              <span className="portfolio-reveal__browser-dot portfolio-reveal__browser-dot--green" />
              <span className="portfolio-reveal__browser-url">
                {flagship?.liveUrl?.replace('https://', '') || 'mkcwebsite.vercel.app/'}
              </span>
            </div>

            {/* Screenshot */}
            <div className="portfolio-reveal__screenshot-wrap">
              <img
                className="portfolio-reveal__screenshot"
                src={mkcScreenshot}
                alt={`${flagship?.title || 'MKC Website'} — live project screenshot`}
                loading="eager"
                draggable="false"
              />
              <div className="portfolio-reveal__glass" />
            </div>
          </div>

          {/* Laptop base */}
          <div className="portfolio-reveal__base" ref={baseRef} />
          <div className="portfolio-reveal__hinge" ref={hingeRef} />
        </div>

        {/* Text content — fades in at end of reveal */}
        <div className="portfolio-reveal__content" ref={contentRef}>
          <span className="portfolio-reveal__project-label">
            {flagship?.type || '3D Corporate Website'}
          </span>
          <h3 className="portfolio-reveal__project-title">
            {flagship?.title || 'MKC Website'}
          </h3>
          <p className="portfolio-reveal__project-outcome">
            {flagship?.result || "A 3D web experience that became MKC's primary brand differentiator."}
          </p>
          <a
            href={flagship?.liveUrl || 'https://mkcwebsite.vercel.app/'}
            target="_blank"
            rel="noopener noreferrer"
            className="portfolio-reveal__cta"
            data-cursor
          >
            Visit Live Site
            <svg className="portfolio-reveal__cta-arrow" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Scroll hint — visible during reveal, fades as text appears */}
      <div className="portfolio-reveal__scroll-hint" ref={scrollHintRef}>
        <div className="portfolio-reveal__scroll-hint-line" />
        <span>Scroll to reveal</span>
      </div>
    </div>
  )
}
