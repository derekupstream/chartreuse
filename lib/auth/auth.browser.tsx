import { createContext, useEffect, useState, useCallback } from 'react'
import { auth, FirebaseAuthProvider, User } from './firebaseClient'
import { UserCredential, onIdTokenChanged, signOut, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth'
import { setCookie, destroyCookie } from 'nookies'

export type { User }

export type Credentials = {
  email: string
  password: string
}

type AuthContextType = {
  user: User | null
  login: (credentials: Credentials) => Promise<UserCredential | null>
  loginWithProvider: (provider: FirebaseAuthProvider) => Promise<UserCredential | null>
  signup: (credentials: Credentials) => Promise<UserCredential | null>
  signout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: (credentials: Credentials) => Promise.resolve(null),
  loginWithProvider: (provider: FirebaseAuthProvider) => Promise.resolve(null),
  signup: (credentials: Credentials) => Promise.resolve(null),
  signout: () => Promise.resolve(),
})

export const AuthProvider: React.FC<{ children: any }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
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

  // force refresh the token every 10 minutes
  useEffect(() => {
    const handle = setInterval(async () => {
      const user = auth.currentUser
      if (user) await user.getIdToken(true)
    }, 10 * 60 * 1000)

    // clean up setInterval
    return () => clearInterval(handle)
  }, [])

  const login = useCallback(({ email, password }: Credentials) => {
    return signInWithEmailAndPassword(auth, email, password)
  }, [])

  const loginWithProvider = useCallback((provider: FirebaseAuthProvider) => {
    return signInWithPopup(auth, provider)
  }, [])

  const signup = useCallback(({ email, password }: Credentials) => {
    return createUserWithEmailAndPassword(auth, email, password)
  }, [])

  const signout = useCallback(() => {
    return signOut(auth).then(() => {
      setUser(null)
      destroyCookie(null, 'token')
    })
  }, [])

  return <AuthContext.Provider value={{ user, login, loginWithProvider, signup, signout }}>{children}</AuthContext.Provider>
}
