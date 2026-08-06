import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useContent } from '../context/ContentContext'
import './Services.css'

gsap.registerPlugin(ScrollTrigger)

export default function Services() {
  const { siteCopy, services } = useContent()
  const sectionRef = useRef()
  const reelTrackRef = useRef()
  const card0Ref = useRef()
  const card1Ref = useRef()
  const card2Ref = useRef()
  const stage0Ref = useRef()
  const stage1Ref = useRef()
  const stage2Ref = useRef()
  const svgLineRef = useRef()
  const progressFillRef = useRef()
  const activeNumRef = useRef()

  useEffect(() => {
    const track = reelTrackRef.current
    if (!track) return

    const isMobile = window.innerWidth <= 768

    // Set initial GSAP states
    gsap.set(card0Ref.current, { opacity: 1, scale: 1 })
    gsap.set(card1Ref.current, { opacity: 0.25, scale: 0.92 })
    gsap.set(card2Ref.current, { opacity: 0.25, scale: 0.92 })

    gsap.set(stage0Ref.current, { opacity: 1, y: 0, scale: 1, rotateX: 6 })
    gsap.set(stage1Ref.current, { opacity: 0, y: 80, scale: 0.88, rotateX: 12 })
    gsap.set(stage2Ref.current, { opacity: 0, y: 80, scale: 0.88, rotateX: 12 })

    // Create single scrubbed GSAP timeline with strong resistance and resting hold buffers
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: isMobile ? '+=400%' : '+=650%',
        pin: true,
        scrub: isMobile ? 1.5 : 2.2,
        anticipatePin: 1,
      }
    })

    // ── STAGE 0 (Resting Hold: 0 → 0.6) ──
    tl.to({}, { duration: 0.6 })

    // ── STAGE 0 → STAGE 1 TRANSITION (0.6 → 1.6) ──
      .to(track, { yPercent: -33.33, duration: 1, ease: 'power2.inOut' }, 0.6)
      .to(card0Ref.current, { opacity: 0.2, scale: 0.9, duration: 1 }, 0.6)
      .to(card1Ref.current, { opacity: 1, scale: 1, duration: 1 }, 0.6)
      .to(stage0Ref.current, { opacity: 0, y: -70, scale: 0.85, rotateX: -6, duration: 1 }, 0.6)
      .to(stage1Ref.current, { opacity: 1, y: 0, scale: 1, rotateX: 6, duration: 1 }, 0.6)
      .to(progressFillRef.current, { width: '66.6%', duration: 1 }, 0.6)
      .to(svgLineRef.current, { strokeDashoffset: 160, duration: 1 }, 0.6)

    // ── STAGE 1 (Resting Hold: 1.6 → 2.2) ──
      .to({}, { duration: 0.6 })

    // ── STAGE 1 → STAGE 2 TRANSITION (2.2 → 3.2) ──
      .to(track, { yPercent: -66.66, duration: 1, ease: 'power2.inOut' }, 2.2)
      .to(card1Ref.current, { opacity: 0.2, scale: 0.9, duration: 1 }, 2.2)
      .to(card2Ref.current, { opacity: 1, scale: 1, duration: 1 }, 2.2)
      .to(stage1Ref.current, { opacity: 0, y: -70, scale: 0.85, rotateX: -6, duration: 1 }, 2.2)
      .to(stage2Ref.current, { opacity: 1, y: 0, scale: 1, rotateX: 6, duration: 1 }, 2.2)
      .to(progressFillRef.current, { width: '100%', duration: 1 }, 2.2)
      .to(svgLineRef.current, { strokeDashoffset: 0, duration: 1 }, 2.2)

    // ── STAGE 2 (Resting Hold: 3.2 → 4.0 before unpinning) ──
      .to({}, { duration: 0.8 })

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <section id="services" className="section services" ref={sectionRef}>
      <div className="services__spotlight" />
      <div className="services__grid-pattern" />

      <div className="container">
        {/* Main Layout */}
        <div className="services__layout">
          {/* Left Column: Vertical Sliding Narrative Reel */}
          <div className="services__narrative">
            <div className="services__head">
              <span className="section-label">{siteCopy.servicesLabel}</span>
              <h2>{siteCopy.servicesHeading}</h2>
              <p className="services__lead">{siteCopy.servicesLead}</p>
            </div>

            {/* Sliding Reel Viewport */}
            <div className="svc-reel-viewport glass">
              <div className="svc-reel-track" ref={reelTrackRef}>
                {/* Card 01: Frontend */}
                <div className="svc-reel-card" ref={card0Ref}>
                  <div className="svc-reel-card__header">
                    <span className="svc-reel-card__num">01 / 03 DISCIPLINE</span>
                    <span className="svc-reel-card__tag">{services[0]?.tag || 'Frontend Engineering'}</span>
                  </div>
                  <h3 className="svc-reel-card__title">{services[0]?.title || 'React JS'}</h3>
                  <p className="svc-reel-card__sub">{services[0]?.subtitle || 'Component-Driven Interfaces'}</p>
                  <div className="svc-reel-card__divider" />
                  <div className="svc-reel-card__body">
                    {Array.isArray(services[0]?.desc)
                      ? services[0].desc.map((p, i) => <p key={i}>{p}</p>)
                      : <p>{services[0]?.desc}</p>}
                  </div>
                  {services[0]?.highlight && (
                    <div className="svc-reel-card__stack">
                      <span>STACK:</span> {services[0].highlight}
                    </div>
                  )}
                </div>

                {/* Card 02: Backend */}
                <div className="svc-reel-card" ref={card1Ref}>
                  <div className="svc-reel-card__header">
                    <span className="svc-reel-card__num">02 / 03 DISCIPLINE</span>
                    <span className="svc-reel-card__tag">{services[1]?.tag || 'Backend Engineering'}</span>
                  </div>
                  <h3 className="svc-reel-card__title">{services[1]?.title || 'Node.js'}</h3>
                  <p className="svc-reel-card__sub">{services[1]?.subtitle || 'Scalable API Architecture'}</p>
                  <div className="svc-reel-card__divider" />
                  <div className="svc-reel-card__body">
                    {Array.isArray(services[1]?.desc)
                      ? services[1].desc.map((p, i) => <p key={i}>{p}</p>)
                      : <p>{services[1]?.desc}</p>}
                  </div>
                  {services[1]?.highlight && (
                    <div className="svc-reel-card__stack">
                      <span>STACK:</span> {services[1].highlight}
                    </div>
                  )}
                </div>

                {/* Card 03: Full-Stack */}
                <div className="svc-reel-card" ref={card2Ref}>
                  <div className="svc-reel-card__header">
                    <span className="svc-reel-card__num">03 / 03 DISCIPLINE</span>
                    <span className="svc-reel-card__tag">{services[2]?.tag || 'Full-Stack Solutions'}</span>
                  </div>
                  <h3 className="svc-reel-card__title">{services[2]?.title || 'Custom Web Apps'}</h3>
                  <p className="svc-reel-card__sub">{services[2]?.subtitle || 'End-to-End Digital Products'}</p>
                  <div className="svc-reel-card__divider" />
                  <div className="svc-reel-card__body">
                    {Array.isArray(services[2]?.desc)
                      ? services[2].desc.map((p, i) => <p key={i}>{p}</p>)
                      : <p>{services[2]?.desc}</p>}
                  </div>
                  {services[2]?.highlight && (
                    <div className="svc-reel-card__stack">
                      <span>STACK:</span> {services[2].highlight}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="svc-reel-progress">
                <div className="svc-reel-progress__bar">
                  <div className="svc-reel-progress__fill" ref={progressFillRef} />
                </div>
                <div className="svc-reel-progress__hint">Scroll to animate timeline</div>
              </div>
            </div>
          </div>

          {/* Right Column: Continuous Morphing Visual Canvas */}
          <div className="services__stage-viewport">
            {/* SVG Connecting Motion Vector Line */}
            <svg className="svc-motion-svg" viewBox="0 0 100 400" fill="none">
              <path
                d="M 50 20 L 50 380"
                stroke="var(--indigo)"
                strokeWidth="3"
                strokeDasharray="360"
                strokeDashoffset="360"
                ref={svgLineRef}
              />
            </svg>

            {/* Stage 01: Frontend UI Tree */}
            <div className="svc-stage-canvas" ref={stage0Ref}>
              <div className="svc-stage-canvas__glow" style={{ background: 'radial-gradient(circle, rgba(225,172,244,0.18) 0%, transparent 70%)' }} />
              <div className="svc-ui-tree">
                <div className="svc-ui-tree__card svc-ui-tree__card--frame">
                  <div className="svc-ui-tree__bar">
                    <span className="svc-ui-tree__dot svc-ui-tree__dot--red" />
                    <span className="svc-ui-tree__dot svc-ui-tree__dot--yellow" />
                    <span className="svc-ui-tree__dot svc-ui-tree__dot--green" />
                    <span className="svc-ui-tree__tag">App.jsx · React 18</span>
                  </div>
                  <div className="svc-ui-tree__skeleton">
                    <div className="svc-ui-tree__sk-line" style={{ width: '45%' }} />
                    <div className="svc-ui-tree__sk-box" />
                    <div className="svc-ui-tree__sk-grid">
                      <div className="svc-ui-tree__sk-card" />
                      <div className="svc-ui-tree__sk-card" />
                    </div>
                  </div>
                </div>

                <div className="svc-ui-tree__card svc-ui-tree__card--floating">
                  <div className="svc-ui-tree__chip">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L12 4.5V9.5L7 13L2 9.5V4.5L7 1Z" stroke="var(--purple)" strokeWidth="1.2"/>
                    </svg>
                    Component Tree
                  </div>
                  <p className="svc-ui-tree__code">&lt;HeroStage fps=&#123;60&#125; /&gt;</p>
                  <div className="svc-ui-tree__badge">60 FPS Concurrent UI</div>
                </div>

                <div className="svc-ui-tree__card svc-ui-tree__card--metric">
                  <div className="svc-ui-tree__score">99</div>
                  <div className="svc-ui-tree__score-label">
                    <strong>Lighthouse Score</strong>
                    <span>Performance & Accessibility</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 02: Backend API Pipeline */}
            <div className="svc-stage-canvas" ref={stage1Ref}>
              <div className="svc-stage-canvas__glow" style={{ background: 'radial-gradient(circle, rgba(38,26,177,0.22) 0%, transparent 70%)' }} />
              <div className="svc-api-pipeline">
                <div className="svc-api-pipeline__card">
                  <div className="svc-api-pipeline__header">
                    <span className="svc-api-pipeline__pulse" />
                    Node.js REST & WebSocket Engine
                  </div>
                  <div className="svc-api-pipeline__nodes">
                    <div className="svc-api-pipeline__node">
                      <span className="svc-api-pipeline__node-tag">POST</span>
                      <code>/api/v1/auth/verify</code>
                      <span className="svc-api-pipeline__status">200 OK · 12ms</span>
                    </div>
                    <div className="svc-api-pipeline__node svc-api-pipeline__node--active">
                      <span className="svc-api-pipeline__node-tag svc-api-pipeline__node-tag--ws">WS</span>
                      <code>wss://stream.bytezy.com/live</code>
                      <span className="svc-api-pipeline__status">Connected · 10k req/s</span>
                    </div>
                    <div className="svc-api-pipeline__node">
                      <span className="svc-api-pipeline__node-tag">GET</span>
                      <code>/api/v1/projects/analytics</code>
                      <span className="svc-api-pipeline__status">Cached · Redis</span>
                    </div>
                  </div>
                  <div className="svc-api-pipeline__security">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L2 3.5V7.5C2 11 4.5 14 8 15C11.5 14 14 11 14 7.5V3.5L8 1Z" stroke="var(--purple)" strokeWidth="1.2"/>
                    </svg>
                    <span>JWT + Role-Based Access Control + Rate-Limiting Active</span>
                  </div>
                </div>

                <div className="svc-api-pipeline__floating">
                  <div className="svc-api-pipeline__payload-title">JSON PAYLOAD STREAM</div>
                  <pre className="svc-api-pipeline__json">
{`{
  "status": "success",
  "latency": "14ms",
  "encrypted": true
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Stage 03: Full-Stack Cloud Chamber */}
            <div className="svc-stage-canvas" ref={stage2Ref}>
              <div className="svc-stage-canvas__glow" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' }} />
              <div className="svc-cloud-chamber">
                <div className="svc-cloud-chamber__cube">
                  <div className="svc-cloud-chamber__top">
                    <span className="svc-cloud-chamber__status-dot" />
                    Production Release v2.4 · Live
                  </div>
                  <div className="svc-cloud-chamber__grid">
                    <div className="svc-cloud-chamber__block">
                      <span className="svc-cloud-chamber__block-label">FRONTEND</span>
                      <strong>React 18 / Vite</strong>
                      <span className="svc-cloud-chamber__sub">Vercel Edge CDN</span>
                    </div>
                    <div className="svc-cloud-chamber__block">
                      <span className="svc-cloud-chamber__block-label">BACKEND</span>
                      <strong>Node.js API</strong>
                      <span className="svc-cloud-chamber__sub">Auto-Scaling Pods</span>
                    </div>
                    <div className="svc-cloud-chamber__block">
                      <span className="svc-cloud-chamber__block-label">DATABASE</span>
                      <strong>Firestore / Redis</strong>
                      <span className="svc-cloud-chamber__sub">Multi-Region Sync</span>
                    </div>
                    <div className="svc-cloud-chamber__block">
                      <span className="svc-cloud-chamber__block-label">CI / CD</span>
                      <strong>GitHub Actions</strong>
                      <span className="svc-cloud-chamber__sub">Automated Tests</span>
                    </div>
                  </div>
                  <div className="svc-cloud-chamber__terminal">
                    <code>● main  ✓ 0 errors  ✓ load 99.99%  ⟳ HMR active</code>
                  </div>
                </div>

                <div className="svc-cloud-chamber__guarantee">
                  <div className="svc-cloud-chamber__guarantee-icon">⚡</div>
                  <div className="svc-cloud-chamber__guarantee-text">
                    <strong>2-Week Sprint Cadence</strong>
                    <span>Daily async updates & roadmap transparency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glow-divider" style={{ marginTop: '80px' }} />
    </section>
  )
}
