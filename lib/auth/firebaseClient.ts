import firebaseApp from 'firebase/app'
import 'firebase/auth'

export type User = firebaseApp.User
export type FirebaseAuthProvider = firebaseApp.auth.AuthProvider

export const googleProvider = new firebaseApp.auth.GoogleAuthProvider()

const firebaseId = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID
const firebaseProjectNumber = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_NUMBER || '1051608891390'
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1051608891390:web:fb6e4b94327812bb12caaf'

export const firebase = !firebaseApp.apps.length
  ? firebaseApp.initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: `${firebaseId}.firebaseapp.com`,
      projectId: firebaseId,
      storageBucket: `${firebaseId}.appspot.com`,
      messagingSenderId: firebaseProjectNumber,
      appId: firebaseAppId,
    })
  : firebaseApp.app()
