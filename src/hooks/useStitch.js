import { useRef, useCallback } from 'react'
import * as Realm from 'realm-web'

const APP_ID = import.meta.env.VITE_STITCH_APP_ID || 'bytezy-builds-app'
const API_KEY = import.meta.env.VITE_STITCH_API_KEY

let appInstance = null

function getApp() {
  if (!appInstance) {
    appInstance = new Realm.App({ id: APP_ID })
  }
  return appInstance
}

export function useStitch() {
  const userRef = useRef(null)

  const login = useCallback(async () => {
    const app = getApp()
    if (app.currentUser) {
      userRef.current = app.currentUser
      return app.currentUser
    }
    try {
      const credentials = Realm.Credentials.apiKey(API_KEY)
      const user = await app.logIn(credentials)
      userRef.current = user
      return user
    } catch (err) {
      console.warn('[Stitch] API key auth failed, trying anonymous:', err.message)
      try {
        const user = await app.logIn(Realm.Credentials.anonymous())
        userRef.current = user
        return user
      } catch (anonErr) {
        console.error('[Stitch] Auth failed:', anonErr)
        throw anonErr
      }
    }
  }, [])

  const insertDocument = useCallback(async (collectionName, document) => {
    const app = getApp()
    let user = userRef.current || app.currentUser
    if (!user) user = await login()

    const mongo = user.mongoClient('mongodb-atlas')
    const collection = mongo.db('bytezy_builds').collection(collectionName)
    const result = await collection.insertOne({
      ...document,
      createdAt: new Date()
    })
    return result
  }, [login])

  const submitBooking = useCallback(async (formData) => {
    return insertDocument('bookings', formData)
  }, [insertDocument])

  const submitContact = useCallback(async (formData) => {
    return insertDocument('contacts', formData)
  }, [insertDocument])

  return { login, submitBooking, submitContact }
}
