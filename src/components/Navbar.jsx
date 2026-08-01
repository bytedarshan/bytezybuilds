import React, { useState, useEffect, useRef } from 'react'
import { useMagnetic } from '../hooks/useMagnetic'
import './Navbar.css'

const links = [
  { label: 'Services',   href: '#services' },
  { label: 'Portfolio',  href: '#portfolio' },
  { label: 'Project',    href: '#deploy' },
  { label: 'Contact',    href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const magnetic = useMagnetic(70, 0.3)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <a href="#hero" className="navbar__logo" id="stitch-anchor">
          <span className="navbar__logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="24" height="24" rx="6" stroke="#E1ACF4" strokeWidth="1.5"/>
              <rect x="7" y="7" width="6" height="6" rx="1.5" fill="#261AB1"/>
              <rect x="15" y="7" width="6" height="6" rx="1.5" fill="#E1ACF4" opacity="0.6"/>
              <rect x="7" y="15" width="6" height="6" rx="1.5" fill="#E1ACF4" opacity="0.4"/>
              <rect x="15" y="15" width="6" height="6" rx="1.5" fill="#261AB1" opacity="0.7"/>
            </svg>
          </span>
          <span className="navbar__logo-text">Bytezy<span>Builds</span></span>
        </a>

        {/* Links */}
        <ul className="navbar__links">
          {links.map(l => (
            <li key={l.href}>
              <a href={l.href} className="navbar__link">{l.label}</a>
            </li>
          ))}
        </ul>

        {/* CTA — Magnetic */}
        <div
          onMouseMove={magnetic.onMouseMove}
          onMouseLeave={magnetic.onMouseLeave}
          style={{ display: 'inline-flex' }}
        >
          <a href="#deploy" className="btn-glow navbar__cta" ref={magnetic.ref}>
            Start a Project
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </nav>
  )
}
