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

/* ── Write helpers ────────────────────────────────── */

export async function saveBooking(data) {
  const ref = await addDoc(collection(db, 'bookings'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function saveContact(data) {
  const ref = await addDoc(collection(db, 'contacts'), {
    ...data,
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
