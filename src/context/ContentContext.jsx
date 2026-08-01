import React, { createContext, useContext, useState, useEffect } from 'react'

// Default hardcoded content
export const DEFAULT_SITE_COPY = {
  heroStatus: 'Available for Projects',
  heroTitle1: 'Bytezy',
  heroTitleAccent: 'Builds',
  heroByline: 'By Darshan Challani',
  heroSub: 'We build and own your product end-to-end — from first wireframe to production deploy. React, Node.js, and Three.js applications that perform, convert, and scale.',
  heroCta: 'Start a Project',
  heroGhostCta: 'View Our Work',

  servicesLabel: 'What We Deliver',
  servicesHeading: 'Our Services',
  servicesLead: 'Three disciplines. One seamless product. Every engagement comes with a defined process, clear timelines, and measurable outcomes.',

  portfolioLabel: 'Real Projects · Real Results',
  portfolioHeading: 'What We\'ve Built',
  portfolioLead: 'Live, deployed products by Darshan Challani — the developer behind Bytezy Builds.',
  portfolioGithubCta: 'View All 18 Repos on GitHub — @bytedarshan',

  deployLabel: 'Start a Project',
  deployHeading: 'Tell Us About Your Project',
  deployLead: 'Complete the brief below. Our team will respond within 24 hours with a tailored project roadmap and timeline.',
  deploySubmitCta: 'Submit Project Brief',

  contactLabel: 'Get In Touch',
  contactHeading: 'Let\'s Talk About',
  contactHeadingAccent: 'Your Project',
  contactDesc: 'Have a project in mind? Or want to explore what\'s possible? Drop us a message — we respond within 24 hours, every time.',
  contactFounderName: 'Darshan Challani',
  contactFounderEmail: 'darshan.challani18@gmail.com',
  contactFounderMobile: '+91 9244550030',
  contactFounderLocation: 'Bangalore, India',

  footerTagline: 'Full-stack web development studio. We design, build, and support digital products that drive real business results.',
  footerBuiltLocation: 'Designed & built in Bangalore, India',
}

export const DEFAULT_PROJECTS = [
  {
    id: 'p1',
    num: '01',
    title: 'Enlit-e',
    type: 'Solar Energy Platform',
    challenge: 'Make renewable energy accessible and compelling online.',
    result: 'Near-perfect Lighthouse scores, driving 3× more qualified enquiries.',
    stack: ['React', 'Vite', 'Three.js', 'GSAP'],
    color: '#F59E0B',
    liveUrl: 'https://enlit-e.vercel.app/',
    githubUrl: 'https://github.com/bytedarshan',
    desc: [
      'Enlit-e is a solar energy platform designed to educate and convert customers toward renewable energy adoption. The UI was crafted to feel energetic, clean, and forward-thinking.',
      'Smooth scroll-driven animations and a responsive layout that adapts seamlessly from mobile to desktop. Visual storytelling drives the entire design approach.',
      'Built with React and Vite for fast load performance, achieving near-perfect Lighthouse scores while delivering an engaging experience that drives real enquiries.'
    ],
    metric: 'Solar Energy SaaS',
  },
  {
    id: 'p2',
    num: '02',
    title: 'MKC Website',
    type: '3D Corporate Website',
    challenge: 'Stand out in a crowded corporate space.',
    result: 'A 3D web experience that became MKC\'s primary brand differentiator.',
    stack: ['React', 'Three.js', 'GSAP', 'Vite'],
    color: '#6366F1',
    liveUrl: 'https://mkcwebsite.vercel.app/',
    githubUrl: 'https://github.com/bytedarshan',
    desc: [
      'A 3D corporate website built for MKC that demonstrates how premium digital presence translates directly to brand authority.',
      'Three.js powers immersive 3D elements throughout, combined with a clean professional layout that builds immediate trust with visitors.',
      'Every scroll interaction, transition, and hover state was choreographed with GSAP to create a cohesive, high-quality experience.'
    ],
    metric: '3D Corporate Site',
  },
  {
    id: 'p3',
    num: '03',
    title: 'bytedarshan',
    type: 'Open Source · GitHub',
    challenge: '18 public repositories spanning full-stack, 3D, and tooling.',
    result: 'Consistent production-quality code that demonstrates range and depth.',
    stack: ['React', 'Node.js', 'HTML', 'JavaScript'],
    color: '#10B981',
    liveUrl: 'https://github.com/bytedarshan',
    githubUrl: 'https://github.com/bytedarshan',
    desc: [
      '18 public repositories spanning full-stack web applications, 3D interactive experiences, and custom tooling — each built to production standards.',
      'The portfolio showcases consistent commitment to clean architecture, modern tooling, and delivery quality — the same standards that drive every Bytezy Builds project.',
      'From fundamentals to React + Three.js + GSAP-powered experiences, this profile demonstrates the technical depth behind the Bytezy Builds brand.'
    ],
    metric: '18 Repositories',
  },
]

export const DEFAULT_SERVICES = [
  {
    id: 's1',
    tag: 'Frontend Engineering',
    title: 'React JS',
    subtitle: 'Component-Driven Interfaces',
    desc: [
      'We architect single-page applications using React 18 with concurrent rendering, delivering consistent 60fps performance across every device your users own.',
      'Each project ships with a shared component library and responsive design system, tested across mobile through 4K breakpoints — no surprises after handoff.',
      'We set a performance budget at the start of every engagement: sub-second first paint, optimised bundle splits, and lazy loading where it matters. You get the metrics to prove it.'
    ],
    highlight: 'React 18 · Vite · Zustand · React Query',
  },
  {
    id: 's2',
    tag: 'Backend Engineering',
    title: 'Node.js',
    subtitle: 'Scalable API Architecture',
    desc: [
      'We design and build REST and GraphQL APIs using Node.js and Express, engineered for horizontal scaling from day one. Every endpoint is documented, versioned, and load-tested before deployment.',
      'Security is baked in, not bolted on. Every backend includes JWT authentication, role-based access control, rate limiting, and structured error handling as standard.',
      'Real-time features — live dashboards, push notifications, collaborative tools — run on WebSocket infrastructure built to handle thousands of concurrent connections reliably.'
    ],
    highlight: 'Node.js · Express · MongoDB · Redis · WebSockets',
  },
  {
    id: 's3',
    tag: 'Full-Stack Solutions',
    title: 'Custom Web Apps',
    subtitle: 'End-to-End Digital Products',
    desc: [
      'From concept to deployment, we own the entire product lifecycle. Our team works in two-week sprints with daily async updates, so you always know exactly where your project stands.',
      'We integrate third-party APIs — payment gateways, CRMs, analytics platforms, AI models — into a unified product experience with zero friction for your end users.',
      'Post-launch, we provide dedicated monitoring, automated CI/CD pipelines, and proactive performance tuning. Your product stays healthy and keeps growing after we hand it over.'
    ],
    highlight: 'Full-Stack · CI/CD · AWS · Vercel · Monitoring',
  },
]

const ContentContext = createContext()

export function ContentProvider({ children }) {
  const [siteCopy, setSiteCopy] = useState(() => {
    const saved = localStorage.getItem('bytezy_site_copy')
    return saved ? { ...DEFAULT_SITE_COPY, ...JSON.parse(saved) } : DEFAULT_SITE_COPY
  })

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('bytezy_projects')
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS
  })

  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('bytezy_services')
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES
  })

  const updateCopy = (key, val) => {
    setSiteCopy(prev => {
      const next = { ...prev, [key]: val }
      localStorage.setItem('bytezy_site_copy', JSON.stringify(next))
      return next
    })
  }

  const updateAllCopy = (newCopy) => {
    setSiteCopy(newCopy)
    localStorage.setItem('bytezy_site_copy', JSON.stringify(newCopy))
  }

  const resetCopy = () => {
    setSiteCopy(DEFAULT_SITE_COPY)
    localStorage.removeItem('bytezy_site_copy')
  }

  const saveProject = (proj) => {
    setProjects(prev => {
      let next
      if (proj.id && prev.some(p => p.id === proj.id)) {
        next = prev.map(p => p.id === proj.id ? proj : p)
      } else {
        const id = proj.id || `p_${Date.now()}`
        const num = proj.num || `0${prev.length + 1}`
        next = [...prev, { ...proj, id, num }]
      }
      localStorage.setItem('bytezy_projects', JSON.stringify(next))
      return next
    })
  }

  const deleteProject = (id) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id)
      localStorage.setItem('bytezy_projects', JSON.stringify(next))
      return next
    })
  }

  const resetProjects = () => {
    setProjects(DEFAULT_PROJECTS)
    localStorage.removeItem('bytezy_projects')
  }

  const saveService = (svc) => {
    setServices(prev => {
      let next
      if (svc.id && prev.some(s => s.id === svc.id)) {
        next = prev.map(s => s.id === svc.id ? svc : s)
      } else {
        const id = svc.id || `s_${Date.now()}`
        next = [...prev, { ...svc, id }]
      }
      localStorage.setItem('bytezy_services', JSON.stringify(next))
      return next
    })
  }

  const deleteService = (id) => {
    setServices(prev => {
      const next = prev.filter(s => s.id !== id)
      localStorage.setItem('bytezy_services', JSON.stringify(next))
      return next
    })
  }

  const resetServices = () => {
    setServices(DEFAULT_SERVICES)
    localStorage.removeItem('bytezy_services')
  }

  return (
    <ContentContext.Provider value={{
      siteCopy, updateCopy, updateAllCopy, resetCopy,
      projects, saveProject, deleteProject, resetProjects,
      services, saveService, deleteService, resetServices,
    }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
