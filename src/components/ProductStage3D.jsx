import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Environment } from '@react-three/drei'
import * as THREE from 'three'

/* ── roundRect polyfill for older browsers ─────────── */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r]
    const [tl, tr, br, bl] = r
    this.beginPath()
    this.moveTo(x + tl, y)
    this.lineTo(x + w - tr, y)
    this.quadraticCurveTo(x + w, y, x + w, y + tr)
    this.lineTo(x + w, y + h - br)
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h)
    this.lineTo(x + bl, y + h)
    this.quadraticCurveTo(x, y + h, x, y + h - bl)
    this.lineTo(x, y + tl)
    this.quadraticCurveTo(x, y, x + tl, y)
    this.closePath()
    return this
  }
}

/* ── Animated Screen Texture ───────────────────────── */
function useScreenTexture() {
  const canvasRef = useRef(document.createElement('canvas'))
  const textureRef = useRef(null)
  const frameRef = useRef(0)

  useMemo(() => {
    const c = canvasRef.current
    c.width = 512
    c.height = 320
    textureRef.current = new THREE.CanvasTexture(c)
    textureRef.current.minFilter = THREE.LinearFilter
    textureRef.current.magFilter = THREE.LinearFilter
  }, [])

  useFrame(() => {
    frameRef.current++
    if (frameRef.current % 3 !== 0) return // Update every 3rd frame for perf

    const c = canvasRef.current
    const ctx = c.getContext('2d')
    const t = frameRef.current * 0.02

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, c.height)
    bg.addColorStop(0, '#0a0a1a')
    bg.addColorStop(1, '#12102a')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, c.width, c.height)

    // Top bar
    ctx.fillStyle = '#1a1833'
    ctx.fillRect(0, 0, c.width, 28)
    // Window dots
    const dots = ['#ff5f56', '#ffbd2e', '#27c93f']
    dots.forEach((color, i) => {
      ctx.beginPath()
      ctx.arc(16 + i * 18, 14, 5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    })
    // Tab
    ctx.fillStyle = '#261AB1'
    ctx.beginPath()
    ctx.roundRect(80, 4, 120, 20, 6)
    ctx.fill()
    ctx.fillStyle = '#E1ACF4'
    ctx.font = '10px monospace'
    ctx.fillText('bytezybuilds.com', 88, 18)

    // Code lines
    const codeColors = ['#E1ACF4', '#6c47e0', '#936FAD', '#4930d8', '#a89bff', '#10B981']
    const lineCount = 18
    const startY = 40
    const scroll = (t * 8) % (lineCount * 22)

    for (let i = 0; i < lineCount; i++) {
      const y = startY + i * 16 - (scroll % 16)
      if (y < 28 || y > c.height - 4) continue

      // Line number
      ctx.fillStyle = '#4a3f6a'
      ctx.font = '10px monospace'
      ctx.fillText(`${(i + Math.floor(scroll / 16) + 1).toString().padStart(3, ' ')}`, 12, y)

      // Indentation
      const indent = (Math.sin(i * 1.7) > 0 ? 2 : Math.sin(i * 0.8) > 0.3 ? 4 : 0) * 12

      // Code segments
      const segs = 2 + Math.floor(Math.abs(Math.sin(i * 2.3)) * 3)
      let xPos = 44 + indent
      for (let j = 0; j < segs; j++) {
        const w = 20 + Math.abs(Math.sin(i * 1.1 + j * 2.7)) * 60
        ctx.fillStyle = codeColors[(i + j) % codeColors.length]
        ctx.globalAlpha = 0.6 + Math.sin(t + i * 0.5 + j) * 0.3
        ctx.beginPath()
        ctx.roundRect(xPos, y - 9, w, 11, 3)
        ctx.fill()
        ctx.globalAlpha = 1
        xPos += w + 6
        if (xPos > c.width - 30) break
      }
    }

    // Blinking cursor
    if (Math.sin(t * 3) > 0) {
      ctx.fillStyle = '#E1ACF4'
      const cursorLine = 6
      const cursorY = startY + cursorLine * 16 - (scroll % 16)
      if (cursorY > 28 && cursorY < c.height - 4) {
        ctx.fillRect(180, cursorY - 9, 2, 12)
      }
    }

    // Bottom status bar
    ctx.fillStyle = '#261AB1'
    ctx.fillRect(0, c.height - 22, c.width, 22)
    ctx.fillStyle = '#E1ACF4'
    ctx.font = '9px monospace'
    ctx.fillText('● main  ✓ 0 errors  ⟳ HMR active', 12, c.height - 7)

    if (textureRef.current) {
      textureRef.current.needsUpdate = true
    }
  })

  return textureRef.current
}

/* ── Architecture Stack Panels (Front-end / API / Data) ── */
function usePanelTexture(title, subtitle, tag, accentColor) {
  const canvasRef = useRef(document.createElement('canvas'))
  const textureRef = useRef(null)

  useMemo(() => {
    const c = canvasRef.current
    c.width = 512
    c.height = 320
    const ctx = c.getContext('2d')

    // Glass panel dark background
    ctx.fillStyle = '#0f0c24'
    ctx.fillRect(0, 0, c.width, c.height)

    // Border glow
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 4
    ctx.strokeRect(6, 6, c.width - 12, c.height - 12)

    // Header bar
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(12, 12, c.width - 24, 40)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px monospace'
    ctx.fillText(title, 24, 38)

    ctx.fillStyle = accentColor
    ctx.font = 'bold 12px monospace'
    ctx.fillText(tag, c.width - 140, 38)

    // Subtitle
    ctx.fillStyle = '#936FAD'
    ctx.font = '13px sans-serif'
    ctx.fillText(subtitle, 24, 75)

    // Architecture Nodes / Diagram Lines
    ctx.strokeStyle = 'rgba(225, 172, 244, 0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(40, 120); ctx.lineTo(200, 120); ctx.lineTo(260, 180); ctx.lineTo(460, 180)
    ctx.moveTo(40, 220); ctx.lineTo(160, 220); ctx.lineTo(240, 160); ctx.lineTo(460, 160)
    ctx.stroke()

    // Glowing Node Dots
    const nodes = [
      { x: 40, y: 120 }, { x: 200, y: 120 }, { x: 260, y: 180 }, { x: 460, y: 180 },
      { x: 40, y: 220 }, { x: 160, y: 220 }, { x: 240, y: 160 }, { x: 460, y: 160 }
    ]
    nodes.forEach(n => {
      ctx.beginPath()
      ctx.arc(n.x, n.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = accentColor
      ctx.fill()
    })

    // Code snippet preview block
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(24, 250, c.width - 48, 50)
    ctx.fillStyle = '#E1ACF4'
    ctx.font = '11px monospace'
    ctx.fillText(`✓ ${title.toLowerCase()} // compiled & optimized`, 36, 280)

    textureRef.current = new THREE.CanvasTexture(c)
  }, [title, subtitle, tag, accentColor])

  return textureRef.current
}

function StackPanels({ scrollProgress }) {
  const groupRef = useRef()
  const tex1 = usePanelTexture('01 / FRONTEND LAYER', 'React 18 · Concurrent UI · Vite', 'UI / CLIENT', '#E1ACF4')
  const tex2 = usePanelTexture('02 / API & LOGIC', 'Node.js · REST / WebSockets · JWT', 'API / BACKEND', '#6c47e0')
  const tex3 = usePanelTexture('03 / DATA & CLOUD', 'Firestore · Redis · Edge CI/CD', 'DATA / DEPLOY', '#10B981')

  const panel1Ref = useRef()
  const panel2Ref = useRef()
  const panel3Ref = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    const p = scrollProgress.current || 0
    const t = state.clock.elapsedTime

    // Stack panel expansion animation based on scroll progress (0.2 -> 0.85)
    const expandT = Math.min(Math.max((p - 0.15) / 0.7, 0), 1)
    const smoothE = 1 - Math.pow(1 - expandT, 3)

    // Panel positions & opacities
    if (panel1Ref.current) {
      panel1Ref.current.position.y = 0.5 + smoothE * 1.8 + Math.sin(t * 0.9) * 0.05
      panel1Ref.current.position.z = 0.8 * smoothE
      panel1Ref.current.material.opacity = smoothE * 0.95
    }
    if (panel2Ref.current) {
      panel2Ref.current.position.y = 0.5 + smoothE * 2.8 + Math.sin(t * 0.9 + 1) * 0.05
      panel2Ref.current.position.z = -0.2 * smoothE
      panel2Ref.current.material.opacity = smoothE * 0.95
    }
    if (panel3Ref.current) {
      panel3Ref.current.position.y = 0.5 + smoothE * 3.8 + Math.sin(t * 0.9 + 2) * 0.05
      panel3Ref.current.position.z = -1.1 * smoothE
      panel3Ref.current.material.opacity = smoothE * 0.95
    }

    groupRef.current.rotation.y = smoothE * 0.35 + Math.sin(t * 0.4) * 0.05
  })

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Panel 1: Frontend */}
      <mesh ref={panel1Ref} position={[0, 0.5, 0]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[3.2, 2.0]} />
        <meshPhysicalMaterial
          map={tex1}
          transparent
          opacity={0}
          roughness={0.1}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Panel 2: API */}
      <mesh ref={panel2Ref} position={[0, 0.5, 0]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[3.2, 2.0]} />
        <meshPhysicalMaterial
          map={tex2}
          transparent
          opacity={0}
          roughness={0.1}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Panel 3: Data */}
      <mesh ref={panel3Ref} position={[0, 0.5, 0]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[3.2, 2.0]} />
        <meshPhysicalMaterial
          map={tex3}
          transparent
          opacity={0}
          roughness={0.1}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/* ── Procedural Laptop Model ───────────────────────── */
function Laptop({ mousePos, scrollProgress }) {
  const groupRef = useRef()
  const screenLidRef = useRef()
  const screenTex = useScreenTexture()

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const mx = mousePos.current.x
    const my = mousePos.current.y
    const p = scrollProgress ? scrollProgress.current : 0

    // Smooth spring-damped rotation toward cursor + scroll influence
    groupRef.current.rotation.y += (mx * 0.35 + p * 0.4 - groupRef.current.rotation.y) * 0.04
    groupRef.current.rotation.x += (my * -0.12 + 0.1 - p * 0.15 - groupRef.current.rotation.x) * 0.04

    // Gentle floating + scroll lift
    groupRef.current.position.y = -0.1 + Math.sin(t * 0.8) * 0.06 - p * 0.4

    // Lid open angle driven by scroll (0.2° -> 0.45° rad)
    if (screenLidRef.current) {
      screenLidRef.current.rotation.x = 0.2 + p * 0.35
    }
  })

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const baseScale = isMobile ? 0.72 : 1.15
  const posY = isMobile ? -0.7 : -0.1

  return (
    <group ref={groupRef} position={[0, posY, 0]} scale={baseScale}>
      {/* ── Base / Keyboard body ── */}
      <RoundedBox args={[3.2, 0.12, 2.1]} radius={0.04} smoothness={4} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#1a1833"
          metalness={0.85}
          roughness={0.15}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          envMapIntensity={1.2}
        />
      </RoundedBox>

      {/* Keyboard surface detail */}
      <mesh position={[0, 0.065, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 1.4]} />
        <meshStandardMaterial color="#12102a" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Trackpad */}
      <RoundedBox args={[0.9, 0.01, 0.55]} radius={0.02} smoothness={2} position={[0, 0.065, 0.5]}>
        <meshPhysicalMaterial
          color="#1e1a38"
          metalness={0.3}
          roughness={0.4}
          clearcoat={0.4}
        />
      </RoundedBox>

      {/* ── Screen lid (angled) ── */}
      <group ref={screenLidRef} position={[0, 1.1, -1.02]} rotation={[0.2, 0, 0]}>
        {/* Screen bezel */}
        <RoundedBox args={[3.2, 2.1, 0.08]} radius={0.04} smoothness={4}>
          <meshPhysicalMaterial
            color="#1a1833"
            metalness={0.85}
            roughness={0.15}
            clearcoat={0.6}
            clearcoatRoughness={0.2}
            envMapIntensity={1.2}
          />
        </RoundedBox>

        {/* Screen display */}
        <mesh position={[0, 0.02, 0.042]}>
          <planeGeometry args={[2.85, 1.78]} />
          <meshBasicMaterial map={screenTex} toneMapped={false} />
        </mesh>

        {/* Screen glass overlay */}
        <mesh position={[0, 0.02, 0.045]}>
          <planeGeometry args={[2.85, 1.78]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.04}
            roughness={0.0}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0}
          />
        </mesh>
      </group>

      {/* ── Hinge ── */}
      <mesh position={[0, 0.06, -1.02]}>
        <cylinderGeometry args={[0.04, 0.04, 3.0, 16]} />
        <meshPhysicalMaterial color="#2a2545" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

/* ── Glass Pedestal ────────────────────────────────── */
function Pedestal() {
  return (
    <group position={[0, -1.2, 0]}>
      {/* Main platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 64]} />
        <meshPhysicalMaterial
          color="#1a1535"
          metalness={0.6}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Rim glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[2.6, 2.8, 64]} />
        <meshBasicMaterial color="#261AB1" transparent opacity={0.5} toneMapped={false} />
      </mesh>

      {/* Inner accent ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[1.8, 1.82, 64]} />
        <meshBasicMaterial color="#E1ACF4" transparent opacity={0.2} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ── Floating Accent Particles ─────────────────────── */
function FloatingParticles() {
  const groupRef = useRef()
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      radius: 2.4 + Math.random() * 1.6,
      y: -0.5 + Math.random() * 2.5,
      speed: 0.15 + Math.random() * 0.2,
      size: 0.02 + Math.random() * 0.04,
      color: i % 3 === 0 ? '#E1ACF4' : i % 3 === 1 ? '#6c47e0' : '#261AB1',
    }))
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i]
      child.position.x = Math.cos(p.angle + t * p.speed) * p.radius
      child.position.z = Math.sin(p.angle + t * p.speed) * p.radius
      child.position.y = p.y + Math.sin(t * 0.6 + i) * 0.3
    })
  })

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[0, p.y, 0]}>
          <icosahedronGeometry args={[p.size, 1]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ── Camera Controller ─────────────────────────────── */
function CameraController({ mousePos, scrollProgress }) {
  const { camera } = useThree()
  useFrame(() => {
    const p = scrollProgress ? scrollProgress.current : 0
    const targetZ = 5.5 + p * 2.0
    const targetY = 1.0 + p * 1.2
    camera.position.x += (mousePos.current.x * 0.6 - camera.position.x) * 0.035
    camera.position.y += (mousePos.current.y * 0.3 + targetY - camera.position.y) * 0.035
    camera.position.z += (targetZ - camera.position.z) * 0.035
    camera.lookAt(0, 0.3 + p * 0.8, 0)
  })
  return null
}

/* ── Lighting Rig ──────────────────────────────────── */
function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-3, 3, 2]} intensity={1.5} color="#261AB1" distance={10} />
      <pointLight position={[3, 2, -2]} intensity={1} color="#E1ACF4" distance={8} />
      <pointLight position={[0, -1, 3]} intensity={0.5} color="#6c47e0" distance={6} />
      <spotLight
        position={[0, 6, 0]}
        angle={0.4}
        penumbra={0.8}
        intensity={0.8}
        color="#ffffff"
        castShadow={false}
      />
    </>
  )
}

/* ── Main Scene Export ─────────────────────────────── */
export default function ProductStageScene({ mousePos, scrollProgress }) {
  return (
    <>
      <CameraController mousePos={mousePos} scrollProgress={scrollProgress} />
      <LightingRig />
      <Environment preset="city" environmentIntensity={0.4} />
      <Laptop mousePos={mousePos} scrollProgress={scrollProgress} />
      <StackPanels scrollProgress={scrollProgress} />
      <Pedestal />
      <FloatingParticles />
    </>
  )
}

