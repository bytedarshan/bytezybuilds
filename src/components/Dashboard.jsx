import React, { useState, useEffect, useCallback } from 'react'
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, fetchBookings, fetchContacts, fetchClients, updateBookingStatus, deleteBooking, updateContactStatus, deleteContact, saveClient, updateClient, deleteClient } from '../lib/firebase'
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
  const [authed, setAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [contacts, setContacts] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [modalType, setModalType] = useState('')
  const [search, setSearch] = useState('')
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
      fetchData() // Refresh fully
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
          <span>Admin<span>Panel</span></span>
        </div>

        <nav className="dash-sidebar__nav">
          {[
            { id: 'bookings', label: 'Bookings', icon: '📋', count: bookings.length },
            { id: 'contacts', label: 'Messages', icon: '✉️', count: contacts.length },
            { id: 'clients', label: 'Clients', icon: '👥', count: clients.length },
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
              {tab === 'bookings' ? 'Project Bookings' : tab === 'contacts' ? 'Contact Messages' : 'Client Directory'}
            </h1>
            <p className="dash-sub">
              {tab === 'bookings'
                ? 'Clients who submitted project briefs via the Deployment Room'
                : tab === 'contacts'
                  ? 'Visitors who reached out through the contact form'
                  : 'Aggregated client profiles based on contact and booking details'}
            </p>
          </div>
          <div className="dash-header__search">
            <input
              className="field-input dash-search"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <StatCard
            icon={<span style={{ fontSize: '1.2rem' }}>📋</span>}
            label="Total Bookings"
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
            icon={<span style={{ fontSize: '1.2rem' }}>👥</span>}
            label="Total Clients"
            value={clients.length}
            sub="Aggregated profiles"
            color="#10B981"
          />
          <StatCard
            icon={<span style={{ fontSize: '1.2rem' }}>🌐</span>}
            label="Pending Work"
            value={bookings.filter(b => b.status !== 'completed').length}
            sub="Unfinished bookings"
            color="#F59E0B"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="dash-error">
            ⚠️ {error}
          </div>
        )}

        {/* Add Client Form */}
        {tab === 'clients' && (
          <div style={{ marginBottom: 20 }}>
            {!showAddClient ? (
              <button className="btn-glow" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={() => setShowAddClient(true)}>
                + Manually Add Client
              </button>
            ) : (
              <form className="glass" style={{ padding: 20 }} onSubmit={handleCreateClient}>
                <h4 style={{ marginBottom: 15, color: '#E1ACF4' }}>Create Client</h4>
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
        )}

        {/* Loading */}
        {loading && (
          <div className="dash-loading">
            <div className="dash-spinner" />
            Connecting to Atlas…
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="dash-table glass">
            <div className="dash-table__header">
              <div>Name / Project</div>
              <div>Type</div>
              <div>Contact</div>
              <div>Details</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            <div className="dash-table__body">
              {tab === 'bookings' && (
                filteredBookings.length > 0
                  ? filteredBookings.map((b, i) => (
                    <BookingRow key={b.id || i} b={b} onView={item => openModal(item, 'booking')} onToggle={handleToggleBooking} onDelete={handleDeleteBooking} />
                  ))
                  : <div className="dash-empty">
                    <span>📋</span>
                    <p>{search ? 'No results match your search.' : 'No bookings yet. Share your website!'}</p>
                  </div>
              )}
              {tab === 'contacts' && (
                filteredContacts.length > 0
                  ? filteredContacts.map((c, i) => (
                    <ContactRow key={c.id || i} c={c} onView={item => openModal(item, 'contact')} onToggle={handleToggleContact} onDelete={handleDeleteContact} />
                  ))
                  : <div className="dash-empty">
                    <span>✉️</span>
                    <p>{search ? 'No results match your search.' : 'No contact messages yet.'}</p>
                  </div>
              )}
              {tab === 'clients' && (
                filteredClients.length > 0
                  ? filteredClients.map((c, i) => (
                    <ClientRow key={c.id || i} c={c} onView={item => openModal(item, 'client')} />
                  ))
                  : <div className="dash-empty">
                    <span>👥</span>
                    <p>{search ? 'No results match your search.' : 'No clients yet.'}</p>
                  </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {modal && <Modal item={modal} type={modalType} onClose={closeModal} onAction={handleClientAction} allClients={clients} />}
    </div>
  )
}
