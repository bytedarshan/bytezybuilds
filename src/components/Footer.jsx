import React from 'react'
import { useContent } from '../context/ContentContext'
import './Footer.css'

const links = {
  'Work': ['Portfolio', 'Services', 'Process', 'Pricing'],
  'Company': ['About Us', 'Careers', 'Blog', 'Press'],
  'Legal': ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
}

export default function Footer() {
  const { siteCopy } = useContent()

  return (
    <footer className="footer">
      <div className="glow-divider" />
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <div className="footer__logo">
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="6" stroke="#E1ACF4" strokeWidth="1.5"/>
                <rect x="7" y="7" width="6" height="6" rx="1.5" fill="#261AB1"/>
                <rect x="15" y="7" width="6" height="6" rx="1.5" fill="#E1ACF4" opacity="0.6"/>
                <rect x="7" y="15" width="6" height="6" rx="1.5" fill="#E1ACF4" opacity="0.4"/>
                <rect x="15" y="15" width="6" height="6" rx="1.5" fill="#261AB1" opacity="0.7"/>
              </svg>
              <span>Bytezy<span>Builds</span></span>
            </div>
            <p className="footer__tagline">
              {siteCopy.footerTagline}
            </p>
            <div className="footer__socials">
              {['GitHub', 'LinkedIn', 'Twitter', 'Dribbble'].map(s => (
                <a key={s} href="#" className="footer__social">{s[0]}</a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([col, items]) => (
            <div className="footer__col" key={col}>
              <h4 className="footer__col-title">{col}</h4>
              <ul>
                {items.map(item => (
                  <li key={item}><a href="#" className="footer__link">{item}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Bytezy Builds. All rights reserved.</span>
          <span className="footer__built">{siteCopy.footerBuiltLocation}</span>
        </div>
      </div>
    </footer>
  )
}
