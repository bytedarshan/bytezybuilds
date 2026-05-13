// src/lib/firebase.js — Bytezy Builds
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

export { signInWithEmailAndPassword, signOut, onAuthStateChanged }

/* ── Storage helpers ──────────────────────────────── */
export async function uploadProjectFile(file) {
  const fileRef = ref(storage, `deployments/${Date.now()}_${file.name}`)
  await uploadBytes(fileRef, file)
  return await getDownloadURL(fileRef)
}

/* ── Client Aggregation Logic ─────────────────────── */
async function aggregateClient(name, email, mobile) {
  if (!name) return null
  
  // Find all clients
  const snap = await getDocs(collection(db, 'clients'))
  const clients = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  
  // Find matching client: same name AND (same email OR same mobile)
  const match = clients.find(c => 
    c.name.toLowerCase() === name.toLowerCase() &&
    (
      (email && c.emails && c.emails.includes(email)) ||
      (mobile && c.mobiles && c.mobiles.includes(mobile))
    )
  )

  if (match) {
    // Update if there are new emails or mobiles
    const newEmails = new Set(match.emails || [])
    if (email) newEmails.add(email)
      
    const newMobiles = new Set(match.mobiles || [])
    if (mobile) newMobiles.add(mobile)
      
    if (newEmails.size > (match.emails || []).length || newMobiles.size > (match.mobiles || []).length) {
      await updateDoc(doc(db, 'clients', match.id), {
        emails: Array.from(newEmails),
        mobiles: Array.from(newMobiles)
      })
    }
    return match.id
  } else {
    // Create new client
    const ref = await addDoc(collection(db, 'clients'), {
      name: name,
      emails: email ? [email] : [],
      mobiles: mobile ? [mobile] : [],
      createdAt: serverTimestamp()
    })
    return ref.id
  }
}

/* ── Write helpers ────────────────────────────────── */

export async function saveBooking(data) {
  // Aggregate client before saving booking
  const clientId = await aggregateClient(data.clientName, data.clientEmail, data.clientMobile)
  
  const ref = await addDoc(collection(db, 'bookings'), {
    ...data,
    clientId,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function saveContact(data) {
  // Also aggregate contacts into clients
  const clientId = await aggregateClient(data.name, data.email, data.mobile)

  const ref = await addDoc(collection(db, 'contacts'), {
    ...data,
    clientId,
    status: 'unread',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/* ── Update/Delete helpers ────────────────────────── */

export async function updateBookingStatus(id, status) {
  await updateDoc(doc(db, 'bookings', id), { status })
}

export async function deleteBooking(id) {
  await deleteDoc(doc(db, 'bookings', id))
}

export async function updateContactStatus(id, status) {
  await updateDoc(doc(db, 'contacts', id), { status })
}

export async function deleteContact(id) {
  await deleteDoc(doc(db, 'contacts', id))
}

/* ── Client Management ────────────────────────────── */

export async function fetchClients() {
  const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function saveClient(data) {
  const ref = await addDoc(collection(db, 'clients'), {
    ...data,
    createdAt: serverTimestamp()
  })
  return ref.id
}

export async function updateClient(id, data) {
  await updateDoc(doc(db, 'clients', id), data)
}

export async function deleteClient(id) {
  await deleteDoc(doc(db, 'clients', id))
}

/* ── Read helpers (Dashboard) ─────────────────────── */

export async function fetchBookings(max = 100) {
  const q    = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function fetchContacts(max = 100) {
  const q    = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
