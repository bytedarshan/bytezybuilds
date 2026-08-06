import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ContentProvider } from './context/ContentContext'
import CustomCursor from './components/CustomCursor'
import ConnectionTrace from './components/ConnectionTrace'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Portfolio from './components/Portfolio'
import DeploymentRoom from './components/DeploymentRoom'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Dashboard from './components/Dashboard'
import Lenis from 'lenis'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

gsap.registerPlugin(ScrollTrigger)

function MainSite() {
  useEffect(() => {
    // Initialize Lenis Smooth Scroll engine
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
    })

    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    // Standard reveal animations
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      )
    })

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Navbar />
      <ConnectionTrace />
      <main>
        <Hero />
        <Services />
        <Portfolio />
        <DeploymentRoom />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <ContentProvider>
      <BrowserRouter>
        <CustomCursor />
        <Routes>
          <Route path="/" element={<MainSite />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </ContentProvider>
  )
}
