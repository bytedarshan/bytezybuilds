import React, { useRef, useState } from 'react'
import { useContent } from '../context/ContentContext'
import PortfolioReveal from './PortfolioReveal'
import './Portfolio.css'

function PortfolioCard({ p, isActive }) {
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
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -5
    const rotY = ((x - cx) / cx) * 5

    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(() => {
      if (card) {
        card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px) scale(${isActive ? 1 : 0.97})`
      }
    })
  }

  const onMouseLeave = () => {
    const card = cardRef.current
    rectRef.current = null
    if (!card) return
    if (animRef.current) cancelAnimationFrame(animRef.current)
    card.style.transform = `scale(${isActive ? 1 : 0.97})`
    card.style.transition = 'transform 0.5s var(--ease-out)'
  }

  const descriptions = Array.isArray(p.desc) ? p.desc : [p.desc || '']
  const stackTags = Array.isArray(p.stack) ? p.stack : (p.stack ? p.stack.split(',') : [])

  return (
    <article
      className={`portfolio-card glass ${isActive ? 'portfolio-card--active' : ''}`}
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      data-cursor
      data-stitch-target
    >
      <div className="portfolio-card__header">
        <span className="portfolio-card__num">{p.num}</span>
        <span className="portfolio-card__type">{p.type}</span>
      </div>

      <div className="portfolio-card__visual" style={{ '--card-color': p.color || '#261AB1' }}>
        <div className="portfolio-card__screen">
          <div className="portfolio-card__bar" />
          <div className="portfolio-card__bar" style={{ width: '60%', opacity: 0.5 }} />
          <div className="portfolio-card__block" style={{ '--c': p.color || '#261AB1' }} />
        </div>
        {p.metric && <div className="portfolio-card__metric">{p.metric}</div>}
      </div>

      <div className="portfolio-card__casestudy">
        {p.challenge && (
          <div className="portfolio-card__casestudy-row">
            <span className="portfolio-card__casestudy-label">Challenge</span>
            <span>{p.challenge}</span>
          </div>
        )}
        {p.result && (
          <div className="portfolio-card__casestudy-row">
            <span className="portfolio-card__casestudy-label">Result</span>
            <span>{p.result}</span>
          </div>
        )}
      </div>

      <div className="portfolio-card__content">
        <h3 className="portfolio-card__title">{p.title}</h3>
        <div className="portfolio-card__desc">
          {descriptions.map((para, j) => <p key={j}>{para}</p>)}
        </div>
        <div className="portfolio-card__stack">
          {stackTags.map(s => (
            <span key={s} className="portfolio-card__tag">{s.trim()}</span>
          ))}
        </div>
        <div className="portfolio-card__links">
          {p.liveUrl && (
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="portfolio-card__link portfolio-card__link--live">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 11L11 2M11 2H5M11 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Live Site
            </a>
          )}
          {p.githubUrl && (
            <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="portfolio-card__link portfolio-card__link--gh">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Portfolio() {
  const { siteCopy, projects } = useContent()
  const trackRef    = useRef()
  const sectionRef  = useRef()
  const isDragging  = useRef(false)
  const startX      = useRef(0)
  const scrollLeft  = useRef(0)
  const [active, setActive] = useState(0)

  const onMouseDown = (e) => {
    isDragging.current = true
    startX.current    = e.pageX - trackRef.current.offsetLeft
    scrollLeft.current = trackRef.current.scrollLeft
    trackRef.current.style.cursor = 'grabbing'
  }
  const onMouseUp = () => {
    isDragging.current = false
    trackRef.current.style.cursor = 'grab'
  }
  const onMouseMove = (e) => {
    if (!isDragging.current) return
    e.preventDefault()
    const x    = e.pageX - trackRef.current.offsetLeft
    const walk = (x - startX.current) * 1.8
    trackRef.current.scrollLeft = scrollLeft.current - walk
  }
  const onScroll = () => {
    if (!trackRef.current || !projects.length) return
    const idx = Math.round(trackRef.current.scrollLeft / (trackRef.current.offsetWidth * 0.78))
    setActive(Math.min(Math.max(idx, 0), projects.length - 1))
  }

  return (
    <section id="portfolio" className="section portfolio" ref={sectionRef}>
      <PortfolioReveal />
      <div className="portfolio__spotlight" />

      <div className="container">
        <div className="portfolio__head gsap-reveal">
          <span className="section-label">{siteCopy.portfolioLabel}</span>
          <h2>{siteCopy.portfolioHeading}</h2>
          <p className="portfolio__lead">
            {siteCopy.portfolioLead}
          </p>
        </div>
      </div>

      <div
        className="portfolio__track"
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        onScroll={onScroll}
      >
        <div className="portfolio__rail">
          {projects.map((p, i) => (
            <PortfolioCard key={p.id || p.num} p={p} isActive={active === i} />
          ))}
        </div>
      </div>

      <div className="portfolio__dots">
        {projects.map((_, i) => (
          <button
            key={i}
            className={`portfolio__dot ${active === i ? 'portfolio__dot--active' : ''}`}
            onClick={() => {
              trackRef.current.scrollTo({ left: i * trackRef.current.offsetWidth * 0.78, behavior: 'smooth' })
              setActive(i)
            }}
          />
        ))}
      </div>

      <div className="portfolio__github-cta">
        <a href="https://github.com/bytedarshan" target="_blank" rel="noopener noreferrer" className="portfolio__github-btn" data-cursor>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
          {siteCopy.portfolioGithubCta}
        </a>
      </div>

      <div className="glow-divider" style={{ marginTop: '60px' }} />
    </section>
  )
}
