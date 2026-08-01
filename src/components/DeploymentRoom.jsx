import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import emailjs from '@emailjs/browser'
import { saveBooking } from '../lib/firebase'
import { useMagnetic } from '../hooks/useMagnetic'
import { useContent } from '../context/ContentContext'
import './DeploymentRoom.css'

const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || 'service_tg9wn17'
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_BOOKING
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || 'dRP3wxLYd8RnY_Fxp'

const STEPS = ['Project Details', 'Your Information', 'Attach & Submit']

const SITE_TYPES = [
  'E-Commerce Store',
  'Portfolio Website',
  'Corporate Website',
  'SaaS Application',
  'Custom Web App',
  'Landing Page',
  'Blog / Content Platform',
  'Booking Platform',
]

function CustomSelect({ value, onChange, onBlur, options, placeholder, hasError }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        if (onBlur) onBlur()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onBlur])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div className={`custom-select ${open ? 'custom-select--open' : ''} ${hasError ? 'custom-select--err' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="custom-select__trigger"
        onClick={() => setOpen(!open)}
        data-cursor
      >
        <span className={!value ? 'custom-select__placeholder' : ''}>
          {value || placeholder}
        </span>
        <svg
          className={`custom-select__arrow ${open ? 'custom-select__arrow--rotated' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="custom-select__menu">
          {options.map((opt) => (
            <div
              key={opt}
              className={`custom-select__option ${value === opt ? 'custom-select__option--selected' : ''}`}
              onClick={() => handleSelect(opt)}
            >
              <span>{opt}</span>
              {value === opt && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--indigo-deep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function validateStep0(form) {
  const e = {}
  if (!form.websiteName.trim())  e.websiteName = 'Project name is required'
  if (!form.websiteType)         e.websiteType = 'Please select a type'
  return e
}
function validateStep1(form) {
  const e = {}
  if (!form.clientName.trim())        e.clientName    = 'Your name is required'
  if (!form.clientEmail.trim())       e.clientEmail   = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail))
                                      e.clientEmail   = 'Enter a valid email'
  if (!form.clientMobile.trim())      e.clientMobile  = 'Mobile number is required'
  else if (!/^\+?[\d\s-]{8,15}$/.test(form.clientMobile.trim()))
                                      e.clientMobile  = 'Enter a valid mobile number'
  if (!form.businessDetails.trim())   e.businessDetails = 'Business details are required'
  else if (form.businessDetails.trim().length < 20)
                                      e.businessDetails = 'Please add more detail (min 20 chars)'
  return e
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'bytezybuild')
    
    fetch('https://api.cloudinary.com/v1_1/dojfcjtgn/raw/upload', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) reject(new Error(data.error.message))
      else resolve(data.secure_url)
    })
    .catch(err => reject(err))
  })
}

function DropZone({ files, setFiles }) {
  const onDrop = useCallback(accepted => {
    setFiles(prev => [...prev, ...accepted])
  }, [setFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain':      ['.txt'],
    },
    multiple: true,
  })

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name))

  return (
    <div className="dropzone-wrap">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}
        data-cursor
      >
        <input {...getInputProps()} />
        <div className="dropzone__icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 6v18M10 14l8-8 8 8" stroke="var(--indigo-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 28h24" stroke="var(--text-muted-dark)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="dropzone__title">
          {isDragActive ? 'Drop files here...' : 'Drag & drop project files'}
        </p>
        <p className="dropzone__sub">
          PDF, DOCX, TXT — Project briefs, content docs, brand guidelines
        </p>
        <span className="dropzone__btn">Browse Files</span>
      </div>

      {files.length > 0 && (
        <ul className="dropzone__files">
          {files.map(f => (
            <li key={f.name} className="dropzone__file">
              <span className="dropzone__file-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 1h5l3 3v9H3V1z" stroke="var(--indigo-deep)" strokeWidth="1.2"/>
                  <path d="M8 1v3h3"           stroke="var(--indigo-deep)" strokeWidth="1.2"/>
                </svg>
              </span>
              <span className="dropzone__file-name">{f.name}</span>
              <span className="dropzone__file-size">{(f.size/1024).toFixed(1)} KB</span>
              <button className="dropzone__remove" onClick={() => removeFile(f.name)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DeploymentRoom() {
  const { siteCopy } = useContent()
  const [step, setStep]     = useState(0)
  const [files, setFiles]   = useState([])
  const [status, setStatus] = useState('idle')
  const [form, setForm]     = useState({
    websiteName:     '',
    websiteType:     '',
    businessDetails: '',
    clientName:      '',
    clientEmail:     '',
    clientMobile:    '',
  })
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  const panelRef = useRef()
  const magnetic = useMagnetic(70, 0.3)

  const update = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }))
  }
  const blur = (k) => setTouched(prev => ({ ...prev, [k]: true }))

  const next = () => {
    const errs = step === 0 ? validateStep0(form) : validateStep1(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      const touchMap = {}
      Object.keys(errs).forEach(k => { touchMap[k] = true })
      setTouched(prev => ({ ...prev, ...touchMap }))
      return
    }
    setErrors({})
    setStep(s => s + 1)
  }
  const prev = () => { if (step > 0) setStep(s => s - 1) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step < STEPS.length - 1) {
      next()
      return
    }
    if (files.length === 0) {
      setErrors({ form: 'Please attach at least one file before submitting.' })
      return
    }

    setStatus('loading')
    try {
      const uploadedFiles = await Promise.all(
        files.map(async f => {
          const url = await uploadToCloudinary(f)
          return { name: f.name, size: f.size, type: f.type, url }
        })
      )

      await saveBooking({
        websiteName:     form.websiteName,
        websiteType:     form.websiteType,
        clientName:      form.clientName,
        clientEmail:     form.clientEmail,
        clientMobile:    form.clientMobile,
        businessDetails: form.businessDetails,
        files: uploadedFiles,
      })

      if (EJS_TEMPLATE) {
        emailjs.send(
          EJS_SERVICE,
          EJS_TEMPLATE,
          {
            website_name:     form.websiteName,
            website_type:     form.websiteType,
            client_name:      form.clientName,
            client_email:     form.clientEmail,
            client_mobile:    form.clientMobile,
            business_details: form.businessDetails,
            file_count:       String(files.length),
            reply_to:         form.clientEmail,
          },
          EJS_KEY
        ).catch(err => console.error('[EmailJS]', err))
      }

      setStatus('success')
    } catch (err) {
      console.error('[Booking]', err)
      setErrors({ form: err.message || 'Submission failed.' })
      setStatus('error')
    }
  }

  const fieldErr = (k) => touched[k] && errors[k]

  const reset = () => {
    setStatus('idle')
    setStep(0)
    setForm({ websiteName: '', websiteType: '', businessDetails: '', clientName: '', clientEmail: '', clientMobile: '' })
    setFiles([])
    setErrors({})
    setTouched({})
  }

  return (
    <section id="deploy" className="section section--light deployment">

      <div className="container">
        <div className="deployment__head gsap-reveal">
          <span className="section-label">{siteCopy.deployLabel}</span>
          <h2>{siteCopy.deployHeading}</h2>
          <p className="deployment__lead">
            {siteCopy.deployLead}
          </p>
        </div>

        <div className="deploy-panel gsap-reveal" ref={panelRef}>
          <div className="deploy-panel__bar">
            <span className="deploy-panel__title">Project Brief</span>
          </div>

          <div className="deploy-panel__steps">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`deploy-panel__step ${i === step ? 'deploy-panel__step--active' : ''} ${i < step ? 'deploy-panel__step--done' : ''}`}
                onClick={() => i < step && setStep(i)}
              >
                <div className="deploy-panel__step-num">
                  {i < step ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="var(--indigo-deep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : i + 1}
                </div>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {status === 'success' ? (
            <div className="deploy-panel__success">
              <div className="deploy-panel__success-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="var(--indigo-deep)" strokeWidth="1.5"/>
                  <path d="M14 24l8 8 12-14" stroke="var(--indigo-deep)" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Brief Received</h3>
              <p>Your project brief has been received and saved. Expect a response within 24 hours.</p>
              <div className="deploy-panel__success-details">
                <span>✓ Saved to our system</span>
                <span>✓ Email notification sent</span>
                <span>✓ {files.length} file{files.length !== 1 ? 's' : ''} attached</span>
              </div>
              <button className="btn-glow" onClick={reset}>
                Submit Another Project
              </button>
            </div>

          ) : (
            <form className="deploy-panel__form" onSubmit={handleSubmit} noValidate>

              {step === 0 && (
                <div className="deploy-panel__panel">
                  <div className="deploy-panel__section-title">Project Details</div>
                  <div className="deploy-panel__fields">
                    <div className={`deploy-panel__field ${fieldErr('websiteName') ? 'deploy-panel__field--err' : ''}`}>
                      <label className="field-label">Website / Project Name</label>
                      <input
                        className="field-input"
                        placeholder="e.g. NexaCommerce, BytezyShop…"
                        value={form.websiteName}
                        onChange={e => update('websiteName', e.target.value)}
                        onBlur={() => blur('websiteName')}
                      />
                      {fieldErr('websiteName') && <span className="field-err">{errors.websiteName}</span>}
                    </div>
                    <div className={`deploy-panel__field ${fieldErr('websiteType') ? 'deploy-panel__field--err' : ''}`}>
                      <label className="field-label">Type of Website</label>
                      <CustomSelect
                        value={form.websiteType}
                        onChange={val => update('websiteType', val)}
                        onBlur={() => blur('websiteType')}
                        options={SITE_TYPES}
                        placeholder="— Select a type —"
                        hasError={Boolean(fieldErr('websiteType'))}
                      />
                      {fieldErr('websiteType') && <span className="field-err">{errors.websiteType}</span>}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="deploy-panel__panel">
                  <div className="deploy-panel__section-title">Your Information</div>
                  <div className="deploy-panel__fields">
                    <div className="deploy-panel__row">
                      <div className={`deploy-panel__field ${fieldErr('clientName') ? 'deploy-panel__field--err' : ''}`}>
                        <label className="field-label">Your Name</label>
                        <input
                          className="field-input"
                          placeholder="Full name"
                          value={form.clientName}
                          onChange={e => update('clientName', e.target.value)}
                          onBlur={() => blur('clientName')}
                        />
                        {fieldErr('clientName') && <span className="field-err">{errors.clientName}</span>}
                      </div>
                      <div className={`deploy-panel__field ${fieldErr('clientEmail') ? 'deploy-panel__field--err' : ''}`}>
                        <label className="field-label">Business Email</label>
                        <input
                          className="field-input"
                          type="email"
                          placeholder="you@company.com"
                          value={form.clientEmail}
                          onChange={e => update('clientEmail', e.target.value)}
                          onBlur={() => blur('clientEmail')}
                        />
                        {fieldErr('clientEmail') && <span className="field-err">{errors.clientEmail}</span>}
                      </div>
                      <div className={`deploy-panel__field ${fieldErr('clientMobile') ? 'deploy-panel__field--err' : ''}`}>
                        <label className="field-label">Mobile Number</label>
                        <input
                          className="field-input"
                          type="tel"
                          placeholder="+1 234 567 890"
                          value={form.clientMobile}
                          onChange={e => update('clientMobile', e.target.value)}
                          onBlur={() => blur('clientMobile')}
                        />
                        {fieldErr('clientMobile') && <span className="field-err">{errors.clientMobile}</span>}
                      </div>
                    </div>
                    <div className={`deploy-panel__field ${fieldErr('businessDetails') ? 'deploy-panel__field--err' : ''}`}>
                      <label className="field-label">Business Details & Vision</label>
                      <textarea
                        className="field-textarea"
                        rows={6}
                        placeholder={`Describe your company, your target audience, and the goals you want this project to achieve.\n\nThe more detail you provide, the better our proposal will be tailored to your vision.`}
                        value={form.businessDetails}
                        onChange={e => update('businessDetails', e.target.value)}
                        onBlur={() => blur('businessDetails')}
                      />
                      {fieldErr('businessDetails') && <span className="field-err">{errors.businessDetails}</span>}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="deploy-panel__panel">
                  <div className="deploy-panel__section-title">Attach Files & Submit</div>
                  <DropZone files={files} setFiles={setFiles} />
                  <div className="deploy-panel__summary">
                    <div className="deploy-panel__summary-row">
                      <span>Project</span>
                      <strong>{form.websiteName || '—'}</strong>
                    </div>
                    <div className="deploy-panel__summary-row">
                      <span>Type</span>
                      <strong>{form.websiteType || '—'}</strong>
                    </div>
                    <div className="deploy-panel__summary-row">
                      <span>Client</span>
                      <strong>{form.clientName || '—'}</strong>
                    </div>
                    <div className="deploy-panel__summary-row">
                      <span>Email</span>
                      <strong>{form.clientEmail || '—'}</strong>
                    </div>
                    <div className="deploy-panel__summary-row">
                      <span>Files</span>
                      <strong>{files.length} attached</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="deploy-panel__nav">
                {step > 0 && (
                  <button type="button" className="deploy-panel__back" onClick={prev} disabled={status === 'loading'}>
                    ← Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button type="button" className="btn-glow" onClick={next}>
                    Next Step →
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div
                      onMouseEnter={magnetic.onMouseEnter}
                      onMouseMove={magnetic.onMouseMove}
                      onMouseLeave={magnetic.onMouseLeave}
                      style={{ display: 'inline-flex' }}
                    >
                      <button
                        type="submit"
                        className={`btn-glow ${status === 'loading' ? 'btn-glow--loading' : ''}`}
                        disabled={status === 'loading' || files.length === 0}
                        ref={magnetic.ref}
                        id="deploy-submit-btn"
                        style={files.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        {status === 'loading' ? (
                          <>
                            <span className="deploy-panel__spinner" />
                            Submitting…
                          </>
                        ) : (
                          siteCopy.deploySubmitCta
                        )}
                      </button>
                    </div>
                    {files.length === 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#d44', textAlign: 'right' }}>* Upload at least 1 file to submit</span>
                    )}
                  </div>
                )}
              </div>

              {status === 'error' && (
                <p className="deploy-panel__error" style={{ whiteSpace: 'pre-wrap' }}>
                  Submission failed. {errors.form || 'Check your connection and try again.'}
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <div className="glow-divider" style={{ marginTop: '80px' }} />
    </section>
  )
}
