import React, { useRef, useEffect } from 'react'
import './Services.css'

const services = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#E1ACF4" strokeWidth="1.2" strokeDasharray="4 2"/>
        <path d="M10 12l6 4-6 4V12zM16 12h6M16 20h6" stroke="#261AB1" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    tag: 'Frontend Engineering',
    title: 'React JS',
    subtitle: 'Component-Driven Interfaces',
    desc: [
      'We architect state-of-the-art single-page applications using React 18 with concurrent rendering, delivering silky-smooth 60fps user experiences that feel native.',
      'Our component library approach ensures pixel-perfect consistency across every breakpoint — from mobile to ultra-wide 4K displays.',
      'Performance is non-negotiable. We implement code-splitting, lazy loading, and virtual DOM optimisations so your app loads in under a second.'
    ],
    highlight: 'React 18 · Vite · Zustand · React Query',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="5" stroke="#E1ACF4" strokeWidth="1.2"/>
        <circle cx="16" cy="16" r="5" stroke="#261AB1" strokeWidth="1.8"/>
        <path d="M16 4v4M16 24v4M4 16h4M24 16h4" stroke="#E1ACF4" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    tag: 'Backend Engineering',
    title: 'Node.js',
    subtitle: 'Scalable API Architecture',
    desc: [
      'We design and build high-throughput REST and GraphQL APIs using Node.js + Express, engineered from the ground up for horizontal scaling and resilience.',
      'Every backend we deliver includes JWT authentication, role-based access control, rate limiting, and comprehensive error handling — security is baked in, not bolted on.',
      'Real-time features — live dashboards, notifications, collaborative tools — are powered by WebSocket infrastructure that handles thousands of concurrent connections.'
    ],
    highlight: 'Node.js · Express · MongoDB · Redis · WebSockets',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 8h20v14a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" stroke="#E1ACF4" strokeWidth="1.2"/>
        <path d="M6 8l10-4 10 4" stroke="#261AB1" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M12 16h8M12 20h5" stroke="#E1ACF4" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
    tag: 'Full-Stack Solutions',
    title: 'Custom Web Apps',
    subtitle: 'End-to-End Digital Products',
    desc: [
      'From concept to deployment, we own the entire product lifecycle. Our full-stack teams work in two-week sprints with daily async updates, so you always know exactly where your project stands.',
      'We integrate third-party APIs — payment gateways, CRMs, analytics platforms, AI models — into a unified, coherent product experience with zero friction for your end users.',
      'Post-launch, we provide dedicated monitoring, automated CI/CD pipelines, and proactive performance optimisation to keep your product healthy and growing.'
    ],
    highlight: 'Full-Stack · CI/CD · AWS · Vercel · Monitoring',
  },
]

function ServiceCard({ svc, index }) {
  const cardRef = useRef()

  const onMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width  / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -10
    const rotY = ((x - cx) / cx) *  10
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`
    card.style.boxShadow = `0 0 40px rgba(38,26,177,0.3), 0 0 80px rgba(225,172,244,0.1), ${-rotY*0.8}px ${rotX*0.8}px 20px rgba(0,0,0,0.3)`
  }

  const onMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    card.style.boxShadow = ''
    card.style.transition = 'transform 0.6s var(--ease-out), box-shadow 0.6s'
  }
  const onMouseEnter = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transition = 'none'
  }

  return (
    <div
      className="svc-card glass"
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      style={{ animationDelay: `${index * 0.15}s` }}
      data-cursor
    >
      <div className="svc-card__icon">{svc.icon}</div>
      <div className="svc-card__tag">{svc.tag}</div>
      <h3 className="svc-card__title">{svc.title}</h3>
      <p className="svc-card__subtitle">{svc.subtitle}</p>
      <div className="svc-card__divider" />
      <div className="svc-card__desc">
        {svc.desc.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="svc-card__highlight">{svc.highlight}</div>
    </div>
  )
}

export default function Services() {
  const sectionRef = useRef()

  return (
    <section id="services" className="section services" ref={sectionRef}>
      {/* Ambient glow */}
      <div className="services__glow services__glow--left"  />
      <div className="services__glow services__glow--right" />

      <div className="container">
        <div className="services__head gsap-reveal">
          <span className="section-label">What We Build</span>
          <h2>Our Core Stack</h2>
          <p className="services__lead">
            Three disciplines. One seamless product. We don't just write code —<br />
            we craft digital infrastructure that powers businesses.
          </p>
        </div>

        <div className="services__grid gsap-reveal">
          {services.map((svc, i) => (
            <ServiceCard key={svc.title} svc={svc} index={i} />
          ))}
        </div>
      </div>

      <div className="glow-divider" style={{ marginTop: '80px' }} />
    </section>
  )
}
