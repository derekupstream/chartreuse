import firebaseApp from 'firebase/app'
import 'firebase/auth'

export type User = firebaseApp.User
export type FirebaseAuthProvider = firebaseApp.auth.AuthProvider

export const googleProvider = new firebaseApp.auth.GoogleAuthProvider()

export const firebase = !firebaseApp.apps.length
  ? firebaseApp.initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: 'upstream-b480b.firebaseapp.com',
      projectId: 'upstream-b480b',
      storageBucket: 'upstream-b480b.appspot.com',
      messagingSenderId: '1051608891390',
      appId: '1:1051608891390:web:fb6e4b94327812bb12caaf',
    })
  : firebaseApp.app()
