import React, { useRef, useState } from 'react'
import './Portfolio.css'

const projects = [
  {
    num: '01',
    title: 'Enlit-e',
    type: 'Solar Energy Platform',
    stack: ['React', 'Vite', 'Three.js', 'GSAP'],
    color: '#F59E0B',
    liveUrl: 'https://enlit-e.vercel.app/',
    githubUrl: 'https://github.com/bytedarshan',
    desc: [
      'Enlit-e is a high-impact solar energy platform designed to educate and convert customers toward renewable energy adoption. The entire UI was crafted to feel energetic, clean, and forward-thinking.',
      'The product features smooth scroll-driven animations and a responsive layout that adapts seamlessly from mobile to desktop. Attention to visual storytelling was the core design philosophy.',
      'Built with React and Vite for blazing-fast load performance, the site achieves near-perfect Lighthouse scores while delivering a rich, engaging user experience that drives real enquiries.'
    ],
    metric: 'Solar Energy SaaS',
  },
  {
    num: '02',
    title: 'MKC Website',
    type: '3D Corporate Website',
    stack: ['React', 'Three.js', 'GSAP', 'Vite'],
    color: '#6366F1',
    liveUrl: 'https://mkcwebsite.vercel.app/',
    githubUrl: 'https://github.com/bytedarshan',
    desc: [
      'A cinematic 3D corporate website built for MKC, pushing the boundaries of what a business site can look and feel like. Three.js powers the immersive 3D elements throughout the experience.',
      'The site demonstrates how premium digital presence translates directly to brand authority — combining WebGL visuals with a clean, professional layout that builds instant trust with visitors.',
      'Every scroll interaction, transition, and hover state was carefully choreographed with GSAP to create a cohesive, film-quality experience that sets MKC apart from every competitor in their space.'
    ],
    metric: '3D Corporate Site',
  },
  {
    num: '03',
    title: 'bytedarshan',
    type: 'Open Source · GitHub',
    stack: ['React', 'Node.js', 'HTML', 'JavaScript'],
    color: '#10B981',
    liveUrl: 'https://github.com/bytedarshan',
    githubUrl: 'https://github.com/bytedarshan',
    desc: [
      '18 public repositories spanning full-stack web applications, 3D interactive experiences, and custom tooling. Every project is a deliberate exploration of cutting-edge web technology.',
      'The repository showcases a consistent commitment to clean code architecture, modern tooling, and production-quality delivery standards — the same principles that drive every Bytezy Builds project.',
      'From HTML/CSS fundamentals to React + Three.js + GSAP powered experiences, this profile charts the technical journey and depth of capability behind the Bytezy Builds brand.'
    ],
    metric: '18 Repositories',
  },
]

export default function Portfolio() {
  const trackRef    = useRef()
  const sectionRef  = useRef()
  const isDragging  = useRef(false)
  const startX      = useRef(0)
  const scrollLeft  = useRef(0)
  const [active, setActive] = useState(0)

  // Drag to scroll
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
    if (!trackRef.current) return
    const idx = Math.round(trackRef.current.scrollLeft / (trackRef.current.offsetWidth * 0.78))
    setActive(Math.min(Math.max(idx, 0), projects.length - 1))
  }

  return (
    <section id="portfolio" className="section portfolio" ref={sectionRef}>
      <div className="portfolio__glow" />

      <div className="container">
        <div className="portfolio__head gsap-reveal">
          <span className="section-label">Real Projects · Real Clients</span>
          <h2>What We've Built</h2>
          <p className="portfolio__lead">
            Live, deployed products by <strong style={{color:'var(--purple)'}}>Darshan Challani</strong> — the developer behind Bytezy Builds.
          </p>
        </div>
      </div>

      {/* Carousel track */}
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
            <article
              key={p.num}
              className={`portfolio-card glass ${active === i ? 'portfolio-card--active' : ''}`}
              data-cursor
            >
              {/* Card header */}
              <div className="portfolio-card__header">
                <span className="portfolio-card__num">{p.num}</span>
                <span className="portfolio-card__type">{p.type}</span>
              </div>

              {/* Visual placeholder */}
              <div className="portfolio-card__visual" style={{ '--card-color': p.color }}>
                <div className="portfolio-card__screen">
                  <div className="portfolio-card__bar" />
                  <div className="portfolio-card__bar" style={{ width: '60%', opacity: 0.5 }} />
                  <div className="portfolio-card__block" style={{ '--c': p.color }} />
                </div>
                <div className="portfolio-card__metric">{p.metric}</div>
              </div>

              {/* Content */}
              <div className="portfolio-card__content">
                <h3 className="portfolio-card__title">{p.title}</h3>
                <div className="portfolio-card__desc">
                  {p.desc.map((para, j) => <p key={j}>{para}</p>)}
                </div>
                <div className="portfolio-card__stack">
                  {p.stack.map(s => (
                    <span key={s} className="portfolio-card__tag">{s}</span>
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
          ))}
        </div>
      </div>

      {/* Dots */}
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

      {/* GitHub CTA */}
      <div className="portfolio__github-cta">
        <a href="https://github.com/bytedarshan" target="_blank" rel="noopener noreferrer" className="portfolio__github-btn" data-cursor>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
          View All 18 Repos on GitHub — @bytedarshan
        </a>
      </div>

      <div className="glow-divider" style={{ marginTop: '60px' }} />
    </section>
  )
}
