import React, { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

/* ── Particle Field (background) ──────────────────── */
function ParticleField({ count = 2200, mousePos }) {
  const meshRef = useRef()
  const { size } = useThree()

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 28
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
      vel[i * 3]     = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 2] = 0
    }
    return [pos, vel]
  }, [count])

  const colorsArray = useMemo(() => {
    const cols = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = Math.random()
      if (t < 0.5) {
        // indigo
        cols[i*3]   = 0.145
        cols[i*3+1] = 0.102
        cols[i*3+2] = 0.69
      } else {
        // purple
        cols[i*3]   = 0.882
        cols[i*3+1] = 0.675
        cols[i*3+2] = 0.957
      }
    }
    return cols
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const attr = meshRef.current.geometry.attributes.position
    const arr  = attr.array
    const t    = state.clock.elapsedTime
    const mx   = mousePos.current.x * 10
    const my   = mousePos.current.y * 6

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2
      // Drift
      arr[ix] += velocities[ix]
      arr[iy] += velocities[iy]
      // Gentle sine wave
      arr[iz] = Math.sin(t * 0.3 + i * 0.012) * 1.5

      // Mouse repulsion
      const dx = arr[ix] - mx
      const dy = arr[iy] - my
      const dist = Math.sqrt(dx*dx + dy*dy)
      if (dist < 3.5) {
        const force = (3.5 - dist) / 3.5 * 0.05
        arr[ix] += dx * force
        arr[iy] += dy * force
      }

      // Bounce boundaries
      if (arr[ix] >  14) { arr[ix] =  14; velocities[ix] *= -1 }
      if (arr[ix] < -14) { arr[ix] = -14; velocities[ix] *= -1 }
      if (arr[iy] >   9) { arr[iy] =   9; velocities[iy] *= -1 }
      if (arr[iy] <  -9) { arr[iy] =  -9; velocities[iy] *= -1 }
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color"    array={colorsArray} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.72}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ── Microcontroller ─────────────────────────────── */
function Microcontroller({ explodeRef }) {
  const groupRef = useRef()
  const particlesRef = useRef()
  const exploded = useRef(false)

  // PCB base
  const pcbColor   = new THREE.Color('#0d2018')
  const chipColor  = new THREE.Color('#1a1a2e')
  const pinColor   = new THREE.Color('#c0a060')
  const glowColor  = new THREE.Color('#E1ACF4')

  // Particle system for explosion
  const explosionCount = 800
  const [exPositions, exOriginals] = useMemo(() => {
    const pos  = new Float32Array(explosionCount * 3)
    const orig = new Float32Array(explosionCount * 3)
    for (let i = 0; i < explosionCount; i++) {
      const x = (Math.random() - 0.5) * 2.4
      const y = (Math.random() - 0.5) * 1.4
      const z = (Math.random() - 0.5) * 0.3
      pos[i*3]  = orig[i*3]  = x
      pos[i*3+1]= orig[i*3+1]= y
      pos[i*3+2]= orig[i*3+2]= z
    }
    return [pos, orig]
  }, [])

  const exTargets = useMemo(() => {
    const t = new Float32Array(explosionCount * 3)
    for (let i = 0; i < explosionCount; i++) {
      t[i*3]   = (Math.random() - 0.5) * 30
      t[i*3+1] = (Math.random() - 0.5) * 20
      t[i*3+2] = (Math.random() - 0.5) * 12
    }
    return t
  }, [])

  const progress = useRef(0)

  useEffect(() => {
    if (explodeRef) explodeRef.current = { progress }
  }, [explodeRef])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    if (progress.current < 0.01) {
      // Normal float
      groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.18
      groupRef.current.rotation.x = Math.sin(t * 0.22) * 0.06
      groupRef.current.position.y = Math.sin(t * 0.4) * 0.12
    } else {
      // Explosion
      const p = Math.min(progress.current, 1)
      groupRef.current.rotation.y += 0.015 * p
      groupRef.current.rotation.x += 0.008 * p
      groupRef.current.scale.setScalar(1 - p * 0.85)
    }

    // Update explosion particles
    if (particlesRef.current && progress.current > 0) {
      const p   = Math.min(progress.current, 1)
      const pos = particlesRef.current.geometry.attributes.position.array
      for (let i = 0; i < explosionCount; i++) {
        const ix = i * 3
        pos[ix]   = exOriginals[ix]   + (exTargets[ix]   - exOriginals[ix])   * p
        pos[ix+1] = exOriginals[ix+1] + (exTargets[ix+1] - exOriginals[ix+1]) * p
        pos[ix+2] = exOriginals[ix+2] + (exTargets[ix+2] - exOriginals[ix+2]) * p
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.material.opacity = p
    }
  })

  // Build PCB geometry pieces
  const chips = [
    { pos: [-0.3,  0.1, 0.06], size: [0.55, 0.55, 0.08] },
    { pos: [ 0.52, 0.22, 0.06], size: [0.3,  0.3,  0.07] },
    { pos: [ 0.52,-0.25, 0.06], size: [0.3,  0.25, 0.07] },
    { pos: [-0.55,-0.28, 0.06], size: [0.22, 0.22, 0.06] },
    { pos: [ 0.0,  0.42, 0.05], size: [0.55, 0.12, 0.05] },
    { pos: [ 0.0, -0.42, 0.05], size: [0.55, 0.12, 0.05] },
  ]
  const pins = []
  for (let i = 0; i < 10; i++) {
    pins.push({ pos: [-1.25 + i * 0.06, -0.52, 0.0], rot: [Math.PI/2, 0, 0] })
    pins.push({ pos: [-1.25 + i * 0.06,  0.52, 0.0], rot: [Math.PI/2, 0, 0] })
  }

  return (
    <group ref={groupRef}>
      {/* PCB base */}
      <mesh>
        <boxGeometry args={[2.4, 1.4, 0.09]} />
        <meshStandardMaterial color={pcbColor} roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Grid lines on PCB (use emissive plane) */}
      <mesh position={[0, 0, 0.046]}>
        <planeGeometry args={[2.38, 1.38]} />
        <meshStandardMaterial
          color="#0b2315"
          emissive="#0e3d1e"
          emissiveIntensity={0.3}
          roughness={0.6}
          transparent opacity={0.9}
        />
      </mesh>

      {/* Chips */}
      {chips.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <boxGeometry args={c.size} />
          <meshStandardMaterial
            color={chipColor}
            roughness={0.2}
            metalness={0.7}
            emissive={i === 0 ? '#261AB1' : '#0a0a1a'}
            emissiveIntensity={i === 0 ? 0.8 : 0.1}
          />
        </mesh>
      ))}

      {/* Pin rows */}
      {pins.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot}>
          <cylinderGeometry args={[0.018, 0.018, 0.16, 6]} />
          <meshStandardMaterial color={pinColor} roughness={0.1} metalness={0.9} />
        </mesh>
      ))}

      {/* Antenna */}
      <mesh position={[1.05, 0.35, 0.04]}>
        <boxGeometry args={[0.06, 0.45, 0.04]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} emissive="#E1ACF4" emissiveIntensity={0.6} />
      </mesh>

      {/* LED dots */}
      {[[-0.3, 0.1], [0.7, -0.05], [-0.7, 0.3]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.09]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial
            color={i === 0 ? '#00ffaa' : i === 1 ? '#E1ACF4' : '#261AB1'}
            emissive={i === 0 ? '#00ffaa' : i === 1 ? '#E1ACF4' : '#261AB1'}
            emissiveIntensity={2.5}
          />
        </mesh>
      ))}

      {/* Orbiting glow lights */}
      <pointLight color="#261AB1" intensity={3} distance={3.5} position={[0, 0, 1.2]} />
      <pointLight color="#E1ACF4" intensity={2} distance={2.5} position={[1, 0.5, 0.8]} />
      <pointLight color="#E1ACF4" intensity={1.5} distance={2} position={[-1, -0.5, 0.8]} />

      {/* Explosion particles (hidden until scroll) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={exPositions} count={explosionCount} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#E1ACF4" size={0.06} transparent opacity={0} sizeAttenuation depthWrite={false} />
      </points>
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
  const sectionRef   = useRef()
  const textRef      = useRef()
  const subRef       = useRef()
  const btnRef       = useRef()
  const badgesRef    = useRef()
  const mousePos     = useRef({ x: 0, y: 0 })
  const explodeRef   = useRef({ progress: { current: 0 } })

  useEffect(() => {
    // Text entrance animations
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

    // Scroll-triggered explosion
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'bottom 60%',
      end: 'bottom -20%',
      scrub: 1.5,
      onUpdate: (self) => {
        explodeRef.current.progress.current = self.progress
      }
    })
  }, [])

  const handlePointerMove = (clientX, clientY) => {
    const x = (clientX / window.innerWidth  - 0.5) * 2
    const y = -(clientY / window.innerHeight - 0.5) * 2
    mousePos.current.x = x
    mousePos.current.y = y

    // Parallax effect on text elements
    if (textRef.current) gsap.to(textRef.current, { x: x * 25, y: -y * 25, duration: 0.6, ease: 'power2.out' })
    if (subRef.current)  gsap.to(subRef.current,  { x: x * 15, y: -y * 15, duration: 0.6, ease: 'power2.out' })
    if (btnRef.current)  gsap.to(btnRef.current,  { x: x * 8,  y: -y * 8,  duration: 0.6, ease: 'power2.out' })
  }

  const onMouseMove = (e) => handlePointerMove(e.clientX, e.clientY)
  
  const onTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  return (
    <section id="hero" className="hero" ref={sectionRef} onMouseMove={onMouseMove} onTouchMove={onTouchMove}>
      {/* Three.js Canvas */}
      <div className="hero__canvas">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
          <CameraRig mousePos={mousePos} />
          <ParticleField mousePos={mousePos} />
          <Float floatIntensity={0.4} rotationIntensity={0.2} speed={1.6}>
            <Microcontroller explodeRef={explodeRef} />
          </Float>
        </Canvas>
      </div>

      {/* Radial gradient overlay */}
      <div className="hero__overlay" />

      {/* Content */}
      <div className="hero__content">
        {/* Status badge */}
        <div className="hero__status">
          <span className="hero__status-dot" />
          Available for Projects
        </div>

        <h1 className="hero__title" ref={textRef}>
          <span className="hero__title-line">Bytezy</span>
          <span className="hero__title-line hero__title-line--accent">Builds</span>
          <span style={{ display: 'block', fontSize: '1.1rem', color: '#E1ACF4', marginTop: '15px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', opacity: 0.8 }}>
            By Darshan Challani
          </span>
        </h1>

        <p className="hero__sub" ref={subRef}>
          We engineer cinematic digital experiences. Premium React + Node.js web applications that command attention and convert at scale.
        </p>

        <div className="hero__actions" ref={btnRef}>
          <a href="#deploy" className="btn-glow">
            Launch Project
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a href="#portfolio" className="hero__ghost-btn">
            View Our Work
          </a>
        </div>

        <div className="hero__badges" ref={badgesRef}>
          {['React JS', 'Node.js', 'Three.js', 'WebGL', 'GSAP'].map(t => (
            <span key={t} className="hero__badge">{t}</span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll">
        <div className="hero__scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  )
}
