import React, { useState } from 'react'
import emailjs from '@emailjs/browser'
import { saveContact } from '../lib/firebase'
import './Contact.css'

/* ── EmailJS credentials ────────────────────────── */
const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || 'service_tg9wn17'
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_CONTACT
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || 'dRP3wxLYd8RnY_Fxp'

/* ── Field validator ─────────────────────────────── */
function validate(form) {
  const errors = {}
  if (!form.name.trim())              errors.name    = 'Name is required'
  if (!form.email.trim())             errors.email   = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                      errors.email   = 'Enter a valid email'
  if (!form.mobile.trim())            errors.mobile  = 'Mobile number is required'
  else if (!/^\+?[\d\s-]{8,15}$/.test(form.mobile.trim()))
                                      errors.mobile  = 'Enter a valid mobile number'
  if (!form.message.trim())           errors.message = 'Message is required'
  else if (form.message.trim().length < 10)
                                      errors.message = 'Message too short (min 10 chars)'
  return errors
}

export default function Contact() {
  const [form, setForm]     = useState({ name: '', email: '', mobile: '', message: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  const update = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }))
    // Clear error on change
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }))
  }

  const blur = (k) => setTouched(prev => ({ ...prev, [k]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      setTouched({ name: true, email: true, mobile: true, message: true })
      return
    }

    setStatus('loading')
    try {
      // 1️⃣ Save to Firebase Firestore
      await saveContact({
        name:    form.name,
        email:   form.email,
        mobile:  form.mobile,
        message: form.message,
      })

      // 2️⃣ Send email notification via EmailJS
      if (EJS_TEMPLATE) {
        await emailjs.send(
          EJS_SERVICE,
          EJS_TEMPLATE,
          {
            from_name:  form.name,
            from_email: form.email,
            from_mobile: form.mobile,
            message:    form.message,
            reply_to:   form.email,
          },
          EJS_KEY
        )
      }

      setStatus('success')
      setForm({ name: '', email: '', mobile: '', message: '' })
      setErrors({})
      setTouched({})
    } catch (err) {
      console.error('[Contact]', err)
      setStatus('error')
    }
  }

  const fieldErr = (k) => touched[k] && errors[k]

  return (
    <section id="contact" className="section contact">
      <div className="contact__glow" />

      <div className="container">
        <div className="contact__inner">
          {/* ── Left col ── */}
          <div className="contact__left gsap-reveal">
            <span className="section-label">Get In Touch</span>
            <h2>Let's Build<br /><span className="contact__accent">Something Great</span></h2>
            <p className="contact__desc">
              Have a project in mind? Or just want to explore what's possible?
              Drop us a message and we'll get back to you within 24 hours.
            </p>

            <div className="contact__info">
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="6" r="4" stroke="#E1ACF4" strokeWidth="1.2"/>
                      <path d="M3 16c0-3.5 3-6 6-6s6 2.5 6 6" stroke="#E1ACF4" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  ),
                  label: 'Founder',
                  value: 'Darshan Challani',
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 4h12v10H3V4z" stroke="#E1ACF4" strokeWidth="1.2"/>
                      <path d="M3 4l6 5 6-5"    stroke="#E1ACF4" strokeWidth="1.2"/>
                    </svg>
                  ),
                  label: 'Email',
                  value: 'darshan.challani18@gmail.com',
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="5" y="2" width="8" height="14" rx="2" stroke="#E1ACF4" strokeWidth="1.2"/>
                      <path d="M8 13h2" stroke="#E1ACF4" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  ),
                  label: 'Mobile',
                  value: '+91 9244550030',
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2c-3.3 0-6 2.7-6 6 0 4.5 6 9 6 9s6-4.5 6-9c0-3.3-2.7-6-6-6z" stroke="#E1ACF4" strokeWidth="1.2"/>
                      <circle cx="9" cy="8" r="2" stroke="#E1ACF4" strokeWidth="1.2"/>
                    </svg>
                  ),
                  label: 'Location',
                  value: 'Bangaluru',
                },
              ].map(item => (
                <div className="contact__info-item" key={item.label}>
                  <div className="contact__info-icon">{item.icon}</div>
                  <div>
                    <div className="contact__info-label">{item.label}</div>
                    <div className="contact__info-value">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right col — form ── */}
          <div className="contact__right gsap-reveal">
            <div className="contact__form-wrap glass">

              {/* ── Success State ── */}
              {status === 'success' ? (
                <div className="contact__success">
                  <div className="contact__success-icon">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" stroke="#E1ACF4" strokeWidth="1.5"/>
                      <path d="M12 20l6 6 10-12" stroke="#E1ACF4" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Transmission Successful</h3>
                  <p>Your message is in. We'll respond within 24 hours.</p>
                  <button className="btn-glow" onClick={() => setStatus('idle')}>
                    Send Another →
                  </button>
                </div>

              ) : (
                <form className="contact__form" onSubmit={handleSubmit} noValidate>
                  <h3 className="contact__form-title">Send a Message</h3>

                  {/* Name */}
                  <div className={`contact__field ${fieldErr('name') ? 'contact__field--err' : ''}`}>
                    <label className="field-label">Your Name</label>
                    <input
                      className="field-input"
                      placeholder="Full name"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      onBlur={() => blur('name')}
                    />
                    {fieldErr('name') && <span className="field-err">{errors.name}</span>}
                  </div>

                  {/* Email */}
                  <div className={`contact__field ${fieldErr('email') ? 'contact__field--err' : ''}`}>
                    <label className="field-label">Email Address</label>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      onBlur={() => blur('email')}
                    />
                    {fieldErr('email') && <span className="field-err">{errors.email}</span>}
                  </div>

                  {/* Mobile */}
                  <div className={`contact__field ${fieldErr('mobile') ? 'contact__field--err' : ''}`}>
                    <label className="field-label">Mobile Number</label>
                    <input
                      className="field-input"
                      type="tel"
                      placeholder="+1 234 567 890"
                      value={form.mobile}
                      onChange={e => update('mobile', e.target.value)}
                      onBlur={() => blur('mobile')}
                    />
                    {fieldErr('mobile') && <span className="field-err">{errors.mobile}</span>}
                  </div>

                  {/* Message */}
                  <div className={`contact__field ${fieldErr('message') ? 'contact__field--err' : ''}`}>
                    <label className="field-label">Message</label>
                    <textarea
                      className="field-textarea"
                      rows={5}
                      placeholder="Tell us about your project..."
                      value={form.message}
                      onChange={e => update('message', e.target.value)}
                      onBlur={() => blur('message')}
                    />
                    {fieldErr('message') && <span className="field-err">{errors.message}</span>}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className={`btn-glow contact__submit ${status === 'loading' ? 'btn-glow--loading' : ''}`}
                    disabled={status === 'loading'}
                    id="contact-submit-btn"
                  >
                    {status === 'loading' ? (
                      <>
                        <span className="contact__spinner" />
                        Transmitting…
                      </>
                    ) : 'Send Message →'}
                  </button>

                  {status === 'error' && (
                    <p className="contact__error">
                      ⚠ Submission failed. Check your connection and try again.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
