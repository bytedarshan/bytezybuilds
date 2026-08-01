import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useMagnetic } from '../hooks/useMagnetic'
import { useContent } from '../context/ContentContext'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

/* ── Glass Panel ─────────────────────────────────── */
function GlassPanel({ position, rotation, color, opacity = 0.5, index, separationRef }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const sep = separationRef.current || 0

    meshRef.current.position.z = position[2] + sep * (index - 1.5) * 1.2
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5 + index * 0.8) * 0.04

    meshRef.current.rotation.x = rotation[0] + Math.sin(t * 0.3 + index) * 0.02
    meshRef.current.rotation.y = rotation[1] + Math.cos(t * 0.25 + index) * 0.015

    meshRef.current.material.opacity = opacity * (1 - sep * 0.6)
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[2.4, 1.5]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.12}
        metalness={0.1}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
        reflectivity={0.9}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ── Glass Stack ─────────────────────────────────── */
function GlassStack({ separationRef }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.08
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.03
  })

  const panels = [
    { pos: [0, 0, -0.8],  rot: [0.04, 0.06, 0],   color: '#1e15a0', opacity: 0.55 },
    { pos: [0, 0, -0.3],  rot: [-0.02, -0.03, 0],  color: '#3525c8', opacity: 0.6 },
    { pos: [0, 0, 0.2],   rot: [0.03, 0.04, 0],    color: '#6c47e0', opacity: 0.5 },
    { pos: [0, 0, 0.7],   rot: [-0.03, -0.05, 0],  color: '#b888cc', opacity: 0.4 },
  ]

  return (
    <group ref={groupRef}>
      {panels.map((p, i) => (
        <GlassPanel
          key={i}
          position={p.pos}
          rotation={p.rot}
          color={p.color}
          opacity={p.opacity}
          index={i}
          separationRef={separationRef}
        />
      ))}

      <pointLight color="#261AB1" intensity={3} distance={6} position={[2, 1.5, 2]} />
      <pointLight color="#E1ACF4" intensity={2} distance={5} position={[-2, -1, 1.5]} />
    </group>
  )
}

/* ── Camera Rig ──────────────────────────────────── */
function CameraRig({ mousePos }) {
  const { camera } = useThree()
  useFrame(() => {
    camera.position.x += (mousePos.current.x * 0.5 - camera.position.x) * 0.04
    camera.position.y += (mousePos.current.y * 0.3 - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)
  })
  return null
}

/* ── Hero Section ────────────────────────────────── */
export default function Hero() {
  const { siteCopy } = useContent()
  const sectionRef   = useRef()
  const textRef      = useRef()
  const subRef       = useRef()
  const btnRef       = useRef()
  const badgesRef    = useRef()
  const mousePos     = useRef({ x: 0, y: 0 })
  const separationRef = useRef(0)
  const magnetic     = useMagnetic(70, 0.3)

  const xTextTo = useRef(null)
  const yTextTo = useRef(null)
  const xSubTo  = useRef(null)
  const ySubTo  = useRef(null)
  const xBtnTo  = useRef(null)
  const yBtnTo  = useRef(null)

  useEffect(() => {
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

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'bottom 60%',
      end: 'bottom -20%',
      scrub: 1.5,
      onUpdate: (self) => {
        separationRef.current = self.progress
      }
    })
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
          camera={{ position: [0, 0, 4.5], fov: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
          <CameraRig mousePos={mousePos} />
          <Float floatIntensity={0.2} rotationIntensity={0.1} speed={1.2}>
            <GlassStack separationRef={separationRef} />
          </Float>
        </Canvas>
      </div>

      <div className="hero__overlay" />

      <div className="hero__content">
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
