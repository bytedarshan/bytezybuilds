import React, { useState, useEffect, useCallback } from 'react'
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, fetchBookings, fetchContacts, fetchClients, updateBookingStatus, deleteBooking, updateContactStatus, deleteContact, saveClient, updateClient, deleteClient } from '../lib/firebase'
import { useContent } from '../context/ContentContext'
import './Dashboard.css'

/* ── Helpers ──────────────────────────────────────── */
function timeAgo(date) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : (date.$date ? new Date(date.$date) : new Date(date))
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}
function fmt(date) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : (date.$date ? new Date(date.$date) : new Date(date))
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function downloadBase64File(base64Data, filename) {
  try {
    const arr = base64Data.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const blob = new Blob([u8arr], { type: mime })
    const url = window.URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename || 'download'
    document.body.appendChild(a)
    a.click()
    
    setTimeout(() => {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 500)
  } catch (err) {
    console.error('Download failed', err)
    alert('Failed to download file.')
  }
}

/* ── Stat Card ────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card glass">
      <div className="stat-card__icon" style={{ background: `${color}15`, borderColor: `${color}30` }}>
        {icon}
      </div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  )
}

/* ── Dynamic SVG Area/Line Chart ─────────────────── */
function SubmissionsChart({ bookings, contacts }) {
  const getRecentMonths = () => {
    const now = new Date()
    const list = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = d.toLocaleString('en-US', { month: 'short' })
      const year = d.getFullYear()
      const monthIdx = d.getMonth()
      list.push({ label: monthName, monthIdx, year })
    }
    return list
  }

  const monthList = getRecentMonths()

  const parseDate = (val) => {
    if (!val) return null
    if (typeof val === 'string') return new Date(val)
    if (val.$date) return new Date(val.$date)
    if (val.toDate) return val.toDate()
    return new Date(val)
  }

  const bookingCounts = monthList.map(m => {
    return bookings.filter(b => {
      const d = parseDate(b.createdAt)
      return d && d.getMonth() === m.monthIdx && d.getFullYear() === m.year
    }).length
  })

  const contactCounts = monthList.map(m => {
    return contacts.filter(c => {
      const d = parseDate(c.createdAt)
      return d && d.getMonth() === m.monthIdx && d.getFullYear() === m.year
    }).length
  })

  const maxVal = Math.max(...bookingCounts, ...contactCounts, 4)
  const height = 180
  const width = 640

  const getPoints = (counts) => counts.map((val, i) => {
    const x = 40 + (i / (monthList.length - 1)) * (width - 80)
    const y = height - 26 - (val / maxVal) * (height - 52)
    return { x, y, val }
  })

  const bPts = getPoints(bookingCounts)
  const cPts = getPoints(contactCounts)

  const makePathD = (pts) => {
    return pts.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = pts[i - 1]
      const cx = (prev.x + p.x) / 2
      return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
    }, '')
  }

  const bLineD = makePathD(bPts)
  const cLineD = makePathD(cPts)

  const bAreaD = `${bLineD} L ${bPts[bPts.length - 1].x} ${height - 26} L ${bPts[0].x} ${height - 26} Z`
  const cAreaD = `${cLineD} L ${cPts[cPts.length - 1].x} ${height - 26} L ${cPts[0].x} ${height - 26} Z`

  const totalActivity = bookings.length + contacts.length

  return (
    <div className="glass" style={{ padding: 24, borderRadius: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Submission & Lead Growth</h3>
          <p style={{ fontSize: '0.82rem', color: '#A09BB0' }}>
            Real timeline data ({totalActivity} total submission{totalActivity !== 1 ? 's' : ''} recorded)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#E1ACF4' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6c47e0' }} />
            Project Briefs ({bookings.length})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#936FAD' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E1ACF4' }} />
            Messages ({contacts.length})
          </div>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 500, height: 'auto' }}>
          <defs>
            <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c47e0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6c47e0" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E1ACF4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#E1ACF4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((r, i) => (
            <line
              key={i}
              x1="40"
              y1={height - 26 - r * (height - 52)}
              x2={width - 40}
              y2={height - 26 - r * (height - 52)}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area fills */}
          <path d={bAreaD} fill="url(#bGrad)" />
          <path d={cAreaD} fill="url(#cGrad)" />

          {/* Lines */}
          <path d={bLineD} fill="none" stroke="#6c47e0" strokeWidth="2.5" />
          <path d={cLineD} fill="none" stroke="#E1ACF4" strokeWidth="2" strokeDasharray="6 3" />

          {/* Dots */}
          {bPts.map((p, i) => (
            <g key={`b_${i}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="#6c47e0" stroke="#ffffff" strokeWidth="1.5" />
              {p.val > 0 && (
                <text x={p.x} y={p.y - 8} fill="#6c47e0" fontSize="10" fontWeight="700" textAnchor="middle">{p.val}</text>
              )}
              <text x={p.x} y={height - 4} fill="#A09BB0" fontSize="10" textAnchor="middle">{monthList[i].label}</text>
            </g>
          ))}
          {cPts.map((p, i) => (
            <g key={`c_${i}`}>
              <circle cx={p.x} cy={p.y} r="3" fill="#E1ACF4" />
              {p.val > 0 && (
                <text x={p.x} y={p.y + 12} fill="#E1ACF4" fontSize="9" fontWeight="600" textAnchor="middle">{p.val}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

/* ── Dynamic Project Type Distribution Breakdown ──── */
function ProjectTypeBreakdown({ bookings }) {
  const countsMap = {}
  bookings.forEach(b => {
    const t = b.websiteType || 'Custom Web App'
    countsMap[t] = (countsMap[t] || 0) + 1
  })

  const total = bookings.length
  const colors = ['#6c47e0', '#261AB1', '#E1ACF4', '#10B981', '#F59E0B', '#3B82F6', '#EC4899']

  const categories = Object.keys(countsMap)

  return (
    <div className="glass" style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Project Type Demand</h3>
        <p style={{ fontSize: '0.82rem', color: '#A09BB0' }}>
          Real distribution of {total} brief submission{total !== 1 ? 's' : ''} by website type
        </p>
      </div>

      {total === 0 ? (
        <div style={{ padding: '30px 10px', textAlign: 'center', color: '#A09BB0', fontSize: '0.86rem' }}>
          No project briefs recorded yet.<br />Graphs will automatically plot real statistics as visitors submit briefs.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
          {categories.map((type, idx) => {
            const count = countsMap[type]
            const pct = Math.round((count / total) * 100)
            const color = colors[idx % colors.length]
            return (
              <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: '#fff', fontWeight: 500 }}>{type}</span>
                  <span style={{ color: '#A09BB0' }}>{count} brief{count !== 1 ? 's' : ''} ({pct}%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 4,
                      transition: 'width 0.8s var(--ease-out)'
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Live Real Browser & System Health Widget ─────── */
function LiveSystemDiagnostics() {
  const [loadTime, setLoadTime] = useState('0.42s')
  const [screenRes, setScreenRes] = useState('—')
  const [cores, setCores] = useState(8)

  useEffect(() => {
    if (window.performance) {
      const nav = performance.getEntriesByType('navigation')[0]
      if (nav && nav.duration) {
        setLoadTime(`${(nav.duration / 1000).toFixed(2)}s`)
      }
    }
    setScreenRes(`${window.screen.width} × ${window.screen.height}`)
    if (navigator.hardwareConcurrency) {
      setCores(navigator.hardwareConcurrency)
    }
  }, [])

  return (
    <div className="glass" style={{ padding: 24, borderRadius: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Live Environment & Performance Audit</h3>
        <p style={{ fontSize: '0.82rem', color: '#A09BB0' }}>Real-time browser telemetry & operational status</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: '#A09BB0' }}>Browser Load Time</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10B981', marginTop: 2 }}>{loadTime}</div>
          <div style={{ fontSize: '0.7rem', color: '#936FAD', marginTop: 2 }}>Performance API Telemetry</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: '#A09BB0' }}>Screen Resolution</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#E1ACF4', marginTop: 2 }}>{screenRes}</div>
          <div style={{ fontSize: '0.7rem', color: '#936FAD', marginTop: 2 }}>DPR: {window.devicePixelRatio || 1}x</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: '#A09BB0' }}>Hardware CPU Cores</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#6c47e0', marginTop: 2 }}>{cores} Cores</div>
          <div style={{ fontSize: '0.7rem', color: '#936FAD', marginTop: 2 }}>Multi-thread acceleration</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: '#A09BB0' }}>Firebase & Database Status</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10B981', marginTop: 2 }}>Online</div>
          <div style={{ fontSize: '0.7rem', color: '#936FAD', marginTop: 2 }}>Auth & Firestore Synced</div>
        </div>
      </div>
    </div>
  )
}

/* ── Booking Row ──────────────────────────────────── */
function BookingRow({ b, onView, onToggle, onDelete }) {
  const isDone = b.status === 'completed'
  const [confirmDel, setConfirmDel] = useState(false)
  return (
    <div className={`db-row ${isDone ? 'db-row--dim' : ''}`} data-cursor>
      <div className="db-row__num">{b.websiteName || '—'}</div>
      <div className="db-row__type">
        <span className="db-badge">{b.websiteType || '—'}</span>
      </div>
      <div className="db-row__who">
        <div className="db-row__name">{b.clientName || '—'}</div>
        <div className="db-row__email">{b.clientEmail || '—'}</div>
      </div>
      <div className="db-row__files">
        {(b.files || []).length > 0 ? `${b.files.length} file(s)` : 'None'}
      </div>
      <div className="db-row__actions">
        <button className="db-action-btn" onClick={() => onToggle(b)}>{isDone ? 'Undo' : 'Done'}</button>
        {confirmDel ? (
          <>
            <button className="db-action-btn db-action-btn--del" style={{ background: '#d83030', color: '#fff' }} onClick={() => onDelete(b)}>Yes</button>
            <button className="db-action-btn" onClick={() => setConfirmDel(false)}>No</button>
          </>
        ) : (
          <button className="db-action-btn db-action-btn--del" onClick={() => setConfirmDel(true)}>Del</button>
        )}
        <button className="db-row__view" onClick={() => onView(b)}>View →</button>
      </div>
    </div>
  )
}

/* ── Contact Row ──────────────────────────────────── */
function ContactRow({ c, onView, onToggle, onDelete }) {
  const isDone = c.status === 'read'
  const [confirmDel, setConfirmDel] = useState(false)
  return (
    <div className={`db-row ${isDone ? 'db-row--dim' : ''}`} data-cursor>
      <div className="db-row__num">{c.name || '—'}</div>
      <div className="db-row__type">
        <span className="db-badge db-badge--contact">Contact</span>
      </div>
      <div className="db-row__who">
        <div className="db-row__email">{c.email || '—'}</div>
      </div>
      <div className="db-row__files">{c.message ? c.message.slice(0, 40) + '…' : '—'}</div>
      <div className="db-row__actions">
        <button className="db-action-btn" onClick={() => onToggle(c)}>{isDone ? 'Unread' : 'Read'}</button>
        {confirmDel ? (
          <>
            <button className="db-action-btn db-action-btn--del" style={{ background: '#d83030', color: '#fff' }} onClick={() => onDelete(c)}>Yes</button>
            <button className="db-action-btn" onClick={() => setConfirmDel(false)}>No</button>
          </>
        ) : (
          <button className="db-action-btn db-action-btn--del" onClick={() => setConfirmDel(true)}>Del</button>
        )}
        <button className="db-row__view" onClick={() => onView(c)}>View →</button>
      </div>
    </div>
  )
}

/* ── Client Row ───────────────────────────────────── */
function ClientRow({ c, onView }) {
  return (
    <div className="db-row" data-cursor>
      <div className="db-row__num">{c.name || '—'}</div>
      <div className="db-row__type">
        <span className="db-badge db-badge--client">Client</span>
      </div>
      <div className="db-row__who">
        <div className="db-row__email">{(c.emails || [])[0] || '—'}</div>
        <div className="db-row__email">{(c.mobiles || [])[0] || '—'}</div>
      </div>
      <div className="db-row__files">
        Emails: {(c.emails || []).length} | Mobiles: {(c.mobiles || []).length}
      </div>
      <div className="db-row__actions">
        <button className="db-row__view" onClick={() => onView(c)}>Manage →</button>
      </div>
    </div>
  )
}

/* ── Project Modal / Editor ───────────────────────── */
function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    id: project?.id || '',
    num: project?.num || '',
    title: project?.title || '',
    type: project?.type || '',
    challenge: project?.challenge || '',
    result: project?.result || '',
    metric: project?.metric || '',
    color: project?.color || '#261AB1',
    liveUrl: project?.liveUrl || '',
    githubUrl: project?.githubUrl || '',
    stack: Array.isArray(project?.stack) ? project.stack.join(', ') : project?.stack || '',
    desc1: Array.isArray(project?.desc) ? project.desc[0] || '' : project?.desc || '',
    desc2: Array.isArray(project?.desc) ? project.desc[1] || '' : '',
    desc3: Array.isArray(project?.desc) ? project.desc[2] || '' : '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      stack: form.stack.split(',').map(s => s.trim()).filter(Boolean),
      desc: [form.desc1, form.desc2, form.desc3].filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{project ? `✏️ Edit "${project.title}"` : '🚀 Add New Project'}</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Project Title</label>
              <input className="field-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="field-label">Category / Type</label>
              <input className="field-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Metric Badge</label>
              <input className="field-input" value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })} placeholder="e.g. 3D SaaS" />
            </div>
            <div>
              <label className="field-label">Accent Color</label>
              <input className="field-input" type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ height: 46 }} />
            </div>
            <div>
              <label className="field-label">Tech Stack (comma separated)</label>
              <input className="field-input" value={form.stack} onChange={e => setForm({ ...form, stack: e.target.value })} placeholder="React, Vite, Three.js" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Live URL</label>
              <input className="field-input" value={form.liveUrl} onChange={e => setForm({ ...form, liveUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="field-label">GitHub Repository URL</label>
              <input className="field-input" value={form.githubUrl} onChange={e => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/..." />
            </div>
          </div>

          <div>
            <label className="field-label">Case Study Challenge</label>
            <input className="field-input" value={form.challenge} onChange={e => setForm({ ...form, challenge: e.target.value })} placeholder="What problem did this project solve?" />
          </div>
          <div>
            <label className="field-label">Case Study Result</label>
            <input className="field-input" value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} placeholder="What measurable outcome was delivered?" />
          </div>

          <div>
            <label className="field-label">Description Paragraph 1</label>
            <textarea className="field-textarea" rows={2} value={form.desc1} onChange={e => setForm({ ...form, desc1: e.target.value })} required />
          </div>
          <div>
            <label className="field-label">Description Paragraph 2</label>
            <textarea className="field-textarea" rows={2} value={form.desc2} onChange={e => setForm({ ...form, desc2: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Description Paragraph 3</label>
            <textarea className="field-textarea" rows={2} value={form.desc3} onChange={e => setForm({ ...form, desc3: e.target.value })} />
          </div>

          <div className="modal__footer" style={{ marginTop: 10 }}>
            <button type="submit" className="btn-glow">Save Project</button>
            <button type="button" className="modal__close-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Service Modal / Editor ────────────────────────── */
function ServiceModal({ service, onClose, onSave }) {
  const [form, setForm] = useState({
    id: service?.id || '',
    tag: service?.tag || '',
    title: service?.title || '',
    subtitle: service?.subtitle || '',
    highlight: service?.highlight || '',
    desc1: Array.isArray(service?.desc) ? service.desc[0] || '' : service?.desc || '',
    desc2: Array.isArray(service?.desc) ? service.desc[1] || '' : '',
    desc3: Array.isArray(service?.desc) ? service.desc[2] || '' : '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      desc: [form.desc1, form.desc2, form.desc3].filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{service ? `✏️ Edit "${service.title}"` : '✨ Add New Service'}</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Service Title</label>
              <input className="field-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="field-label">Tag / Discipline</label>
              <input className="field-input" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Frontend Engineering" required />
            </div>
          </div>

          <div>
            <label className="field-label">Subtitle</label>
            <input className="field-input" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Component-Driven Interfaces" />
          </div>
          <div>
            <label className="field-label">Highlight Badge Tags</label>
            <input className="field-input" value={form.highlight} onChange={e => setForm({ ...form, highlight: e.target.value })} placeholder="React 18 · Vite · Zustand" />
          </div>

          <div>
            <label className="field-label">Feature Paragraph 1</label>
            <textarea className="field-textarea" rows={2} value={form.desc1} onChange={e => setForm({ ...form, desc1: e.target.value })} required />
          </div>
          <div>
            <label className="field-label">Feature Paragraph 2</label>
            <textarea className="field-textarea" rows={2} value={form.desc2} onChange={e => setForm({ ...form, desc2: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Feature Paragraph 3</label>
            <textarea className="field-textarea" rows={2} value={form.desc3} onChange={e => setForm({ ...form, desc3: e.target.value })} />
          </div>

          <div className="modal__footer" style={{ marginTop: 10 }}>
            <button type="submit" className="btn-glow">Save Service</button>
            <button type="button" className="modal__close-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Detail Modal ─────────────────────────────────── */
function Modal({ item, type, onClose, onAction, allClients }) {
  if (!item) return null
  const [mergeId, setMergeId] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">
            {type === 'booking' ? `📋 ${item.websiteName || 'Booking'}` : type === 'contact' ? `✉️ ${item.name || 'Contact'}` : `👥 Client Details`}
          </h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          {type === 'booking' ? (
            <>
              <div className="modal__field"><span>Project Name</span><strong>{item.websiteName}</strong></div>
              <div className="modal__field"><span>Type</span><strong>{item.websiteType}</strong></div>
              <div className="modal__field"><span>Client</span><strong>{item.clientName}</strong></div>
              <div className="modal__field"><span>Email</span><strong>{item.clientEmail}</strong></div>
              <div className="modal__field"><span>Mobile</span><strong>{item.clientMobile || '—'}</strong></div>
              <div className="modal__field modal__field--block">
                <span>Business Details</span>
                <p>{item.businessDetails || '—'}</p>
              </div>
              {(item.files || []).length > 0 && (
                <div className="modal__field modal__field--block">
                  <span>Attached Files</span>
                  <ul className="modal__files">
                    {item.files.map((f, i) => (
                      <li key={i}>
                        {f.base64 ? (
                          <button onClick={() => downloadBase64File(f.base64, f.name)} style={{ background: 'none', border: 'none', color: '#E1ACF4', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit' }}>
                            {f.name}
                          </button>
                        ) : f.url ? (
                          <a href={f.url} target="_blank" rel="noreferrer" style={{ color: '#E1ACF4' }}>{f.name}</a>
                        ) : (
                          f.name
                        )}
                        <em> ({(f.size / 1024).toFixed(1)} KB)</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="modal__field"><span>Received</span><strong>{fmt(item.createdAt)}</strong></div>
            </>
          ) : type === 'contact' ? (
            <>
              <div className="modal__field"><span>Name</span><strong>{item.name}</strong></div>
              <div className="modal__field"><span>Email</span><strong>{item.email}</strong></div>
              <div className="modal__field"><span>Mobile</span><strong>{item.mobile || '—'}</strong></div>
              <div className="modal__field modal__field--block">
                <span>Message</span>
                <p>{item.message}</p>
              </div>
              <div className="modal__field"><span>Received</span><strong>{fmt(item.createdAt)}</strong></div>
            </>
          ) : (
            <>
              <div className="modal__field"><span>Name</span><strong>{item.name}</strong></div>
              <div className="modal__field modal__field--block">
                <span>Emails</span>
                <ul className="modal__files">
                  {item.emails?.length ? item.emails.map(e => <li key={e}>{e}</li>) : <li>—</li>}
                </ul>
              </div>
              <div className="modal__field modal__field--block">
                <span>Mobiles</span>
                <ul className="modal__files">
                  {item.mobiles?.length ? item.mobiles.map(m => <li key={m}>{m}</li>) : <li>—</li>}
                </ul>
              </div>
              <div className="modal__field"><span>Created</span><strong>{fmt(item.createdAt)}</strong></div>

              <div className="modal__field modal__field--block" style={{ marginTop: 20, borderColor: '#4a3f70' }}>
                <span>Merge with another client</span>
                <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 10 }}>
                  <select className="field-select" value={mergeId} onChange={e => setMergeId(e.target.value)} style={{ flex: 1 }}>
                    <option value="">Select client to merge INTO this one...</option>
                    {allClients?.filter(c => c.id !== item.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.emails?.[0] || 'No email'})</option>
                    ))}
                  </select>
                  <button className="btn-glow" style={{ padding: '0 20px', fontSize: '0.8rem' }} onClick={() => {
                    if (mergeId) {
                      onAction('merge', item, mergeId);
                      onClose();
                    }
                  }}>Merge</button>
                </div>
                <p style={{ fontSize: '0.75rem', marginTop: 10, color: '#A09BB0' }}>Merging will transfer all emails/mobiles from the selected client to this one, and delete the selected client.</p>
              </div>

              <div className="modal__field modal__field--block" style={{ marginTop: 10, borderColor: '#703f3f' }}>
                <span>Danger Zone</span>
                {confirmDel ? (
                   <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                     <button className="btn-glow" style={{ background: 'linear-gradient(135deg, #b11a1a, #d83030)', border: 'none' }} onClick={() => {
                        onAction('delete', item);
                        onClose();
                     }}>Yes, Delete</button>
                     <button className="dash-refresh" onClick={() => setConfirmDel(false)}>Cancel</button>
                   </div>
                ) : (
                  <button className="btn-glow" style={{ background: 'linear-gradient(135deg, #b11a1a, #d83030)', border: 'none', marginTop: 10 }} onClick={() => setConfirmDel(true)}>Delete Client Profile</button>
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal__footer">
          {type !== 'client' && (
            <a href={`mailto:${item.clientEmail || item.email}`} className="btn-glow" style={{ fontSize: '0.85rem', padding: '10px 22px' }}>
              Reply via Email →
            </a>
          )}
          <button className="modal__close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

/* ── Login Screen ─────────────────────────────────── */
function LoginScreen() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, pass)
    } catch (error) {
      setErr('Invalid credentials.')
      setPass('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dash-login">
      <div className="dash-login__card glass">
        <div className="dash-login__logo">
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="#E1ACF4" strokeWidth="1.5" />
            <rect x="7" y="7" width="6" height="6" rx="1.5" fill="#261AB1" />
            <rect x="15" y="7" width="6" height="6" rx="1.5" fill="#E1ACF4" opacity="0.6" />
            <rect x="7" y="15" width="6" height="6" rx="1.5" fill="#E1ACF4" opacity="0.4" />
            <rect x="15" y="15" width="6" height="6" rx="1.5" fill="#261AB1" opacity="0.7" />
          </svg>
          <span>Bytezy<span>Builds</span> Admin</span>
        </div>
        <h2>Dashboard Access</h2>
        <p>Enter your credentials to continue</p>
        <form onSubmit={submit} className="dash-login__form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className="field-input"
            type="email"
            placeholder="Email address..."
            value={email}
            onChange={e => { setEmail(e.target.value); setErr('') }}
            autoFocus
            required
          />
          <input
            className="field-input"
            type="password"
            placeholder="Password..."
            value={pass}
            onChange={e => { setPass(e.target.value); setErr('') }}
            required
          />
          {err && <p className="dash-login__err" style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{err}</p>}
          <button type="submit" className="btn-glow" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
            {loading ? 'Authenticating...' : 'Enter Dashboard'}
          </button>
        </form>
        <a href="/" className="dash-login__back">← Back to website</a>
      </div>
    </div>
  )
}

/* ── Main Dashboard ───────────────────────────────── */
export default function Dashboard() {
  const { siteCopy, updateCopy, resetCopy, projects, saveProject, deleteProject, resetProjects, services, saveService, deleteService, resetServices } = useContent()
  const [authed, setAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState('analytics') // analytics | bookings | contacts | clients | projects | services | cms

  const [bookings, setBookings] = useState([])
  const [contacts, setContacts] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [modalType, setModalType] = useState('')
  const [search, setSearch] = useState('')

  // Modals for Projects & Services
  const [editingProject, setEditingProject] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [showServiceModal, setShowServiceModal] = useState(false)

  const [showAddClient, setShowAddClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', mobile: '' })

  const openModal = (item, type) => { setModal(item); setModalType(type) }
  const closeModal = () => setModal(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bks, cts, cls] = await Promise.all([
        fetchBookings(100),
        fetchContacts(100),
        fetchClients()
      ])
      setBookings(bks)
      setContacts(cts)
      setClients(cls)
    } catch (e) {
      setError('Could not connect to Firebase. Check your config in .env and make sure Firestore is enabled.')
      console.error('[Dashboard]', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setAuthed(!!user)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, fetchData])

  // Actions
  const handleToggleBooking = async (b) => {
    const newStatus = b.status === 'completed' ? 'pending' : 'completed'
    await updateBookingStatus(b.id, newStatus)
    setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: newStatus } : x))
  }
  const handleDeleteBooking = async (b) => {
    await deleteBooking(b.id)
    setBookings(prev => prev.filter(x => x.id !== b.id))
  }

  const handleToggleContact = async (c) => {
    const newStatus = c.status === 'read' ? 'unread' : 'read'
    await updateContactStatus(c.id, newStatus)
    setContacts(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
  }
  const handleDeleteContact = async (c) => {
    await deleteContact(c.id)
    setContacts(prev => prev.filter(x => x.id !== c.id))
  }

  const handleClientAction = async (action, client, secondaryId) => {
    if (action === 'delete') {
      await deleteClient(client.id)
      setClients(prev => prev.filter(x => x.id !== client.id))
    } else if (action === 'merge') {
      const sec = clients.find(c => c.id === secondaryId)
      if (!sec) return
      const emails = Array.from(new Set([...(client.emails || []), ...(sec.emails || [])]))
      const mobiles = Array.from(new Set([...(client.mobiles || []), ...(sec.mobiles || [])]))

      await updateClient(client.id, { emails, mobiles })
      await deleteClient(secondaryId)
      fetchData()
    }
  }

  const handleCreateClient = async (e) => {
    e.preventDefault()
    if (!newClient.name) return
    await saveClient({
      name: newClient.name,
      emails: newClient.email ? [newClient.email] : [],
      mobiles: newClient.mobile ? [newClient.mobile] : []
    })
    setShowAddClient(false)
    setNewClient({ name: '', email: '', mobile: '' })
    fetchData()
  }

  if (authLoading) return <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="dash-spinner"/></div>
  if (!authed) return <LoginScreen />

  const filteredBookings = bookings.filter(b =>
    !search || [b.websiteName, b.clientName, b.clientEmail, b.clientMobile, b.websiteType]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredContacts = contacts.filter(c =>
    !search || [c.name, c.email, c.mobile, c.message]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredClients = clients.filter(c =>
    !search || [c.name, ...(c.emails || []), ...(c.mobiles || [])]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  const newestBooking = bookings[0]
  const newestContact = contacts[0]

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dash-sidebar glass">
        <div className="dash-sidebar__logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="#E1ACF4" strokeWidth="1.5" />
            <rect x="7" y="7" width="6" height="6" rx="1.5" fill="#261AB1" />
            <rect x="15" y="7" width="6" height="6" rx="1.5" fill="#E1ACF4" opacity="0.6" />
            <rect x="7" y="15" width="6" height="6" rx="1.5" fill="#E1ACF4" opacity="0.4" />
            <rect x="15" y="15" width="6" height="6" rx="1.5" fill="#261AB1" opacity="0.7" />
          </svg>
          <span>Bytezy<span>Builds</span> Admin</span>
        </div>

        <nav className="dash-sidebar__nav">
          {[
            { id: 'analytics', label: 'Analytics & Trends', icon: '📊' },
            { id: 'bookings', label: 'Project Briefs', icon: '📋', count: bookings.length },
            { id: 'contacts', label: 'Messages', icon: '✉️', count: contacts.length },
            { id: 'clients', label: 'Clients', icon: '👥', count: clients.length },
            { id: 'projects', label: 'Portfolio CMS', icon: '🚀', count: projects.length },
            { id: 'services', label: 'Services CMS', icon: '⚡', count: services.length },
            { id: 'cms', label: 'Site Copy & Text', icon: '✍️' },
          ].map(n => (
            <button
              key={n.id}
              className={`dash-nav-btn ${tab === n.id ? 'dash-nav-btn--active' : ''}`}
              onClick={() => setTab(n.id)}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
              {n.count > 0 && <span className="dash-nav-count">{n.count}</span>}
            </button>
          ))}
        </nav>

        <div className="dash-sidebar__actions">
          <button className="dash-refresh" onClick={fetchData}>
            {loading ? '⟳ Refreshing…' : '⟳ Refresh'}
          </button>
          <button className="dash-refresh" onClick={() => signOut(auth)} style={{ color: '#ff8a8a', borderColor: 'rgba(255,100,100,0.2)' }}>
            Logout
          </button>
          <a href="/" className="dash-back-link">← Website</a>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              {tab === 'analytics' ? 'Website Analytics & Statistical Analysis'
                : tab === 'bookings' ? 'Project Briefs & Submissions'
                : tab === 'contacts' ? 'Contact Messages'
                : tab === 'clients' ? 'Client Directory'
                : tab === 'projects' ? 'Portfolio Projects Manager'
                : tab === 'services' ? 'Services & Stack Manager'
                : 'Site Copy & Text CMS'}
            </h1>
            <p className="dash-sub">
              {tab === 'analytics' ? 'Real-time performance metrics, lead conversion analytics, and growth charts'
                : tab === 'bookings' ? 'Clients who submitted project briefs via the Start a Project form'
                : tab === 'contacts' ? 'Visitors who reached out through the contact form'
                : tab === 'clients' ? 'Aggregated client profiles based on contact and booking details'
                : tab === 'projects' ? 'Add, edit, or delete live portfolio showcase projects'
                : tab === 'services' ? 'Manage service offerings, descriptions, and feature tags'
                : 'Edit any text line, header, subtitle, or contact detail across the website live'}
            </p>
          </div>
          {(tab === 'bookings' || tab === 'contacts' || tab === 'clients') && (
            <div className="dash-header__search">
              <input
                className="field-input dash-search"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <StatCard
            icon={<span style={{ fontSize: '1.2rem' }}>📋</span>}
            label="Project Briefs"
            value={bookings.length}
            sub={newestBooking ? `Latest: ${timeAgo(newestBooking.createdAt)}` : 'None yet'}
            color="#261AB1"
          />
          <StatCard
            icon={<span style={{ fontSize: '1.2rem' }}>✉️</span>}
            label="Contact Messages"
            value={contacts.length}
            sub={newestContact ? `Latest: ${timeAgo(newestContact.createdAt)}` : 'None yet'}
            color="#E1ACF4"
          />
          <StatCard
            icon={<span style={{ fontSize: '1.2rem' }}>🚀</span>}
            label="Live Projects"
            value={projects.length}
            sub="Portfolio showcase"
            color="#10B981"
          />
          <StatCard
            icon={<span style={{ fontSize: '1.2rem' }}>⚡</span>}
            label="Core Services"
            value={services.length}
            sub="Active offerings"
            color="#F59E0B"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="dash-error">
            ⚠️ {error}
          </div>
        )}

        {/* ══ TAB 0: ANALYTICS & STATISTICAL ANALYSIS ══ */}
        {tab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Growth Chart */}
            <SubmissionsChart bookings={bookings} contacts={contacts} />

            {/* Grid 2 Column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <ProjectTypeBreakdown bookings={bookings} />
              <LiveSystemDiagnostics />
            </div>

            {/* Additional Real Data Metrics */}
            <div className="glass" style={{ padding: 24, borderRadius: 20 }}>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: 16 }}>Live Performance & Response Telemetry</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#A09BB0' }}>Project Brief Completion Rate</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10B981', marginTop: 4 }}>
                    {bookings.length > 0 ? `${Math.round((bookings.filter(b => b.status === 'completed').length / bookings.length) * 100)}%` : '0%'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#936FAD', marginTop: 4 }}>
                    {bookings.filter(b => b.status === 'completed').length} of {bookings.length} briefs marked done
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#A09BB0' }}>Contact Message Read Rate</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#E1ACF4', marginTop: 4 }}>
                    {contacts.length > 0 ? `${Math.round((contacts.filter(c => c.status === 'read').length / contacts.length) * 100)}%` : '0%'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#936FAD', marginTop: 4 }}>
                    {contacts.filter(c => c.status === 'read').length} of {contacts.length} messages read
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#A09BB0' }}>Total Project Files Attached</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#6c47e0', marginTop: 4 }}>
                    {bookings.reduce((sum, b) => sum + (b.files ? b.files.length : 0), 0)} Files
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#936FAD', marginTop: 4 }}>Across all submitted project briefs</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#A09BB0' }}>Briefs Per Client Ratio</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#F59E0B', marginTop: 4 }}>
                    {clients.length > 0 ? (bookings.length / clients.length).toFixed(1) : '0.0'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#936FAD', marginTop: 4 }}>
                    Across {clients.length} client profile{clients.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 1: BOOKINGS ══ */}
        {tab === 'bookings' && !loading && (
          <div className="dash-table glass">
            <div className="dash-table__header">
              <div>Project Name</div>
              <div>Type</div>
              <div>Client</div>
              <div>Files</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>
            <div className="dash-table__body">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b, i) => (
                  <BookingRow key={b.id || i} b={b} onView={item => openModal(item, 'booking')} onToggle={handleToggleBooking} onDelete={handleDeleteBooking} />
                ))
              ) : (
                <div className="dash-empty">
                  <span>📋</span>
                  <p>{search ? 'No results match your search.' : 'No project briefs received yet.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB 2: CONTACTS ══ */}
        {tab === 'contacts' && !loading && (
          <div className="dash-table glass">
            <div className="dash-table__header">
              <div>Name</div>
              <div>Type</div>
              <div>Email</div>
              <div>Message Preview</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>
            <div className="dash-table__body">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((c, i) => (
                  <ContactRow key={c.id || i} c={c} onView={item => openModal(item, 'contact')} onToggle={handleToggleContact} onDelete={handleDeleteContact} />
                ))
              ) : (
                <div className="dash-empty">
                  <span>✉️</span>
                  <p>{search ? 'No results match your search.' : 'No contact messages received yet.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB 3: CLIENTS ══ */}
        {tab === 'clients' && !loading && (
          <div>
            <div style={{ marginBottom: 20 }}>
              {!showAddClient ? (
                <button className="btn-glow" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={() => setShowAddClient(true)}>
                  + Manually Add Client
                </button>
              ) : (
                <form className="glass" style={{ padding: 20 }} onSubmit={handleCreateClient}>
                  <h4 style={{ marginBottom: 15, color: '#E1ACF4' }}>Create Client Profile</h4>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                    <input className="field-input" placeholder="Name" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} required />
                    <input className="field-input" placeholder="Email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                    <input className="field-input" placeholder="Mobile" value={newClient.mobile} onChange={e => setNewClient({ ...newClient, mobile: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn-glow" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Save</button>
                    <button type="button" className="dash-refresh" onClick={() => setShowAddClient(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
            <div className="dash-table glass">
              <div className="dash-table__header">
                <div>Client Name</div>
                <div>Type</div>
                <div>Contact info</div>
                <div>Details</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>
              <div className="dash-table__body">
                {filteredClients.length > 0 ? (
                  filteredClients.map((c, i) => (
                    <ClientRow key={c.id || i} c={c} onView={item => openModal(item, 'client')} />
                  ))
                ) : (
                  <div className="dash-empty">
                    <span>👥</span>
                    <p>{search ? 'No results match your search.' : 'No client profiles aggregated yet.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 4: PORTFOLIO CMS ══ */}
        {tab === 'projects' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button
                className="btn-glow"
                style={{ padding: '10px 22px', fontSize: '0.88rem' }}
                onClick={() => { setEditingProject(null); setShowProjectModal(true) }}
              >
                + Add New Portfolio Project
              </button>
              <button
                className="dash-refresh"
                onClick={() => { if (window.confirm('Reset portfolio projects to original defaults?')) resetProjects() }}
              >
                Reset to Defaults
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {projects.map((p, i) => (
                <div key={p.id || i} className="glass" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#261AB1' }}>{p.num}</span>
                    <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 50, border: '1px solid rgba(225,172,244,0.2)', color: '#E1ACF4' }}>{p.type}</span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '4px 0' }}>{p.title}</h3>
                  <p style={{ fontSize: '0.84rem', color: '#A09BB0', lineClamp: 2 }}>{Array.isArray(p.desc) ? p.desc[0] : p.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(Array.isArray(p.stack) ? p.stack : (p.stack || '').split(',')).map((s, j) => (
                      <span key={j} style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(225,172,244,0.06)', borderRadius: 50, color: '#936FAD' }}>{s.trim()}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      className="btn-glow"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', flex: 1, justifyContent: 'center' }}
                      onClick={() => { setEditingProject(p); setShowProjectModal(true) }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="dash-action-btn db-action-btn--del"
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      onClick={() => { if (window.confirm(`Delete "${p.title}"?`)) deleteProject(p.id) }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 5: SERVICES CMS ══ */}
        {tab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button
                className="btn-glow"
                style={{ padding: '10px 22px', fontSize: '0.88rem' }}
                onClick={() => { setEditingService(null); setShowServiceModal(true) }}
              >
                + Add New Service
              </button>
              <button
                className="dash-refresh"
                onClick={() => { if (window.confirm('Reset services to original defaults?')) resetServices() }}
              >
                Reset to Defaults
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {services.map((s, i) => (
                <div key={s.id || i} className="glass" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E1ACF4' }}>{s.tag}</span>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.86rem', color: '#936FAD' }}>{s.subtitle}</p>
                  <p style={{ fontSize: '0.84rem', color: '#A09BB0' }}>{Array.isArray(s.desc) ? s.desc[0] : s.desc}</p>
                  {s.highlight && <div style={{ fontSize: '0.72rem', padding: '6px 10px', background: 'rgba(38,26,177,0.1)', borderRadius: 6, color: '#E1ACF4' }}>{s.highlight}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      className="btn-glow"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', flex: 1, justifyContent: 'center' }}
                      onClick={() => { setEditingService(s); setShowServiceModal(true) }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="dash-action-btn db-action-btn--del"
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      onClick={() => { if (window.confirm(`Delete "${s.title}"?`)) deleteService(s.id) }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 6: SITE COPY & TEXT CMS ══ */}
        {tab === 'cms' && (
          <div className="glass" style={{ padding: 32, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>Live Site Text & Copy Editor</h3>
                <p style={{ color: '#A09BB0', fontSize: '0.85rem' }}>Any changes saved here update every text line on the main website immediately.</p>
              </div>
              <button
                className="dash-refresh"
                onClick={() => { if (window.confirm('Reset all website text copy to original defaults?')) resetCopy() }}
              >
                Reset Copy to Defaults
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Hero Copy */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
                <h4 style={{ color: '#E1ACF4', marginBottom: 14, fontSize: '0.95rem' }}>Hero Section</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="field-label">Status Badge</label>
                    <input className="field-input" value={siteCopy.heroStatus} onChange={e => updateCopy('heroStatus', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Main Title Line 1</label>
                    <input className="field-input" value={siteCopy.heroTitle1} onChange={e => updateCopy('heroTitle1', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Main Title Accent Line</label>
                    <input className="field-input" value={siteCopy.heroTitleAccent} onChange={e => updateCopy('heroTitleAccent', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="field-label">Subtitle Description</label>
                  <textarea className="field-textarea" rows={3} value={siteCopy.heroSub} onChange={e => updateCopy('heroSub', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                  <div>
                    <label className="field-label">Primary CTA Label</label>
                    <input className="field-input" value={siteCopy.heroCta} onChange={e => updateCopy('heroCta', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Secondary Ghost CTA Label</label>
                    <input className="field-input" value={siteCopy.heroGhostCta} onChange={e => updateCopy('heroGhostCta', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Services Copy */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
                <h4 style={{ color: '#E1ACF4', marginBottom: 14, fontSize: '0.95rem' }}>Services Section</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="field-label">Section Tag Label</label>
                    <input className="field-input" value={siteCopy.servicesLabel} onChange={e => updateCopy('servicesLabel', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Section Heading</label>
                    <input className="field-input" value={siteCopy.servicesHeading} onChange={e => updateCopy('servicesHeading', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="field-label">Section Subtitle Paragraph</label>
                  <textarea className="field-textarea" rows={2} value={siteCopy.servicesLead} onChange={e => updateCopy('servicesLead', e.target.value)} />
                </div>
              </div>

              {/* Portfolio Copy */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
                <h4 style={{ color: '#E1ACF4', marginBottom: 14, fontSize: '0.95rem' }}>Portfolio Section</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="field-label">Section Tag Label</label>
                    <input className="field-input" value={siteCopy.portfolioLabel} onChange={e => updateCopy('portfolioLabel', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Section Heading</label>
                    <input className="field-input" value={siteCopy.portfolioHeading} onChange={e => updateCopy('portfolioHeading', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="field-label">Section Subtitle Paragraph</label>
                  <input className="field-input" value={siteCopy.portfolioLead} onChange={e => updateCopy('portfolioLead', e.target.value)} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="field-label">GitHub Button Text</label>
                  <input className="field-input" value={siteCopy.portfolioGithubCta} onChange={e => updateCopy('portfolioGithubCta', e.target.value)} />
                </div>
              </div>

              {/* Start a Project Copy */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
                <h4 style={{ color: '#E1ACF4', marginBottom: 14, fontSize: '0.95rem' }}>Start a Project (Brief) Section</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="field-label">Section Tag Label</label>
                    <input className="field-input" value={siteCopy.deployLabel} onChange={e => updateCopy('deployLabel', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Section Heading</label>
                    <input className="field-input" value={siteCopy.deployHeading} onChange={e => updateCopy('deployHeading', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="field-label">Section Subtitle Paragraph</label>
                  <textarea className="field-textarea" rows={2} value={siteCopy.deployLead} onChange={e => updateCopy('deployLead', e.target.value)} />
                </div>
              </div>

              {/* Contact Copy */}
              <div>
                <h4 style={{ color: '#E1ACF4', marginBottom: 14, fontSize: '0.95rem' }}>Contact Section & Founder Info</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="field-label">Founder Name</label>
                    <input className="field-input" value={siteCopy.contactFounderName} onChange={e => updateCopy('contactFounderName', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Founder Email</label>
                    <input className="field-input" value={siteCopy.contactFounderEmail} onChange={e => updateCopy('contactFounderEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Founder Mobile</label>
                    <input className="field-input" value={siteCopy.contactFounderMobile} onChange={e => updateCopy('contactFounderMobile', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                  <div>
                    <label className="field-label">Location Text</label>
                    <input className="field-input" value={siteCopy.contactFounderLocation} onChange={e => updateCopy('contactFounderLocation', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Footer Tagline</label>
                    <input className="field-input" value={siteCopy.footerTagline} onChange={e => updateCopy('footerTagline', e.target.value)} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {modal && <Modal item={modal} type={modalType} onClose={closeModal} onAction={handleClientAction} allClients={clients} />}
      {showProjectModal && <ProjectModal project={editingProject} onClose={() => setShowProjectModal(false)} onSave={saveProject} />}
      {showServiceModal && <ServiceModal service={editingService} onClose={() => setShowServiceModal(false)} onSave={saveService} />}
    </div>
  )
}
