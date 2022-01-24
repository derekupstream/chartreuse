import { createContext, useEffect, useState, useCallback } from 'react'
import { FirebaseAuthProvider, firebase, User } from './firebaseClient'
import firebaseLib from 'firebase'
import { setCookie, destroyCookie } from 'nookies'

export type { User }

export type Credentials = {
  email: string
  password: string
}

type AuthContextType = {
  user: User | null
  login: (credentials: Credentials) => Promise<firebaseLib.auth.UserCredential | null>
  loginWithProvider: (provider: FirebaseAuthProvider) => Promise<firebaseLib.auth.UserCredential | null>
  signup: (credentials: Credentials) => Promise<firebaseLib.auth.UserCredential | null>
  signout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: (credentials: Credentials) => Promise.resolve(null),
  loginWithProvider: (provider: FirebaseAuthProvider) => Promise.resolve(null),
  signup: (credentials: Credentials) => Promise.resolve(null),
  signout: () => Promise.resolve(),
})

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    console.log('subscribe to onIdTokenChanged')
    const unsubscribe = firebase.auth().onIdTokenChanged(async (user: User | null) => {
      if (!user) {
        setUser(null)
        destroyCookie(null, 'token')
        return
      }

      setUser(user)
      const token = await user.getIdToken()
      setCookie(null, 'token', token, {
        path: '/',
      })
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(({ email, password }: Credentials) => {
    return firebase.auth().signInWithEmailAndPassword(email, password)
  }, [])

  const loginWithProvider = useCallback((provider: FirebaseAuthProvider) => {
    return firebase.auth().signInWithPopup(provider)
  }, [])

  const signup = useCallback(({ email, password }: Credentials) => {
    return firebase.auth().createUserWithEmailAndPassword(email, password)
  }, [])

  const signout = useCallback(() => {
    return firebase
      .auth()
      .signOut()
      .then(() => {
        setUser(null)
        destroyCookie(null, 'token')
      })
  }, [])

  return <AuthContext.Provider value={{ user, login, loginWithProvider, signup, signout }}>{children}</AuthContext.Provider>
}
