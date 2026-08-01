import React, { useRef } from 'react'
import { useContent } from '../context/ContentContext'
import './Services.css'

function ServiceCard({ svc, index }) {
  const cardRef = useRef()
  const rectRef = useRef(null)
  const animRef = useRef(null)

  const onMouseEnter = () => {
    const card = cardRef.current
    if (!card) return
    rectRef.current = card.getBoundingClientRect()
    card.style.transition = 'none'
  }

  const onMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    if (!rectRef.current) rectRef.current = card.getBoundingClientRect()

    const rect = rectRef.current
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width  / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -6
    const rotY = ((x - cx) / cx) *  6

    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(() => {
      if (card) {
        card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px)`
      }
    })
  }

  const onMouseLeave = () => {
    const card = cardRef.current
    rectRef.current = null
    if (!card) return
    if (animRef.current) cancelAnimationFrame(animRef.current)
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    card.style.transition = 'transform 0.5s var(--ease-out)'
  }

  const descriptions = Array.isArray(svc.desc) ? svc.desc : [svc.desc || '']

  return (
    <div
      className="svc-card glass"
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ animationDelay: `${index * 0.15}s` }}
      data-cursor
      data-stitch-target
    >
      <div className="svc-card__icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="24" rx="5" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="16" cy="16" r="5" stroke="var(--indigo-deep)" strokeWidth="1.8"/>
        </svg>
      </div>
      <div className="svc-card__tag">{svc.tag}</div>
      <h3 className="svc-card__title">{svc.title}</h3>
      <p className="svc-card__subtitle">{svc.subtitle}</p>
      <div className="svc-card__divider" />
      <div className="svc-card__desc">
        {descriptions.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {svc.highlight && <div className="svc-card__highlight">{svc.highlight}</div>}
    </div>
  )
}

export default function Services() {
  const { siteCopy, services } = useContent()
  const sectionRef = useRef()

  return (
    <section id="services" className="section section--light services" ref={sectionRef}>
      <div className="services__pattern" />

      <div className="container">
        <div className="services__head gsap-reveal">
          <span className="section-label">{siteCopy.servicesLabel}</span>
          <h2>{siteCopy.servicesHeading}</h2>
          <p className="services__lead">
            {siteCopy.servicesLead}
          </p>
        </div>

        <div className="services__grid gsap-reveal">
          {services.map((svc, i) => (
            <ServiceCard key={svc.id || svc.title} svc={svc} index={i} />
          ))}
        </div>
      </div>

      <div className="glow-divider" style={{ marginTop: '80px' }} />
    </section>
  )
}
