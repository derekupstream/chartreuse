import { FirebaseApp, initializeApp } from 'firebase/app'

import { AuthProvider, User, GoogleAuthProvider, getAuth } from 'firebase/auth'

export type { User }
export type FirebaseAuthProvider = AuthProvider

export const googleProvider = new GoogleAuthProvider()

const firebaseId = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID
const firebaseProjectNumber = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_NUMBER || '1051608891390'
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1051608891390:web:fb6e4b94327812bb12caaf'

// @ts-expect-error
let firebase = global.firebase as FirebaseApp

if (!firebase) {
  // @ts-expect-error
  firebase = global.firebase = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: `${firebaseId}.firebaseapp.com`,
    projectId: firebaseId,
    storageBucket: `${firebaseId}.appspot.com`,
    messagingSenderId: firebaseProjectNumber,
    appId: firebaseAppId,
  })
}

export const auth = getAuth(firebase)

export { firebase }
