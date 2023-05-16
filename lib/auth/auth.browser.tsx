import type { UserCredential } from 'firebase/auth';
import { onIdTokenChanged, signOut, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { setCookie, destroyCookie } from 'nookies';
import { createContext, useEffect, useState, useCallback } from 'react';

import type { FirebaseAuthProvider, User } from './firebaseClient';
import { auth } from './firebaseClient';

export type { User };

export type Credentials = {
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  login: (credentials: Credentials, persist: boolean) => Promise<UserCredential | null>;
  loginWithProvider: (provider: FirebaseAuthProvider, persist: boolean) => Promise<UserCredential | null>;
  signup: (credentials: Credentials, persist: boolean) => Promise<UserCredential | null>;
  signout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => Promise.resolve(null),
  loginWithProvider: () => Promise.resolve(null),
  signup: () => Promise.resolve(null),
  signout: () => Promise.resolve()
});

export const AuthProvider: React.FC<{ children: any }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
      if (!user) {
        setUser(null);
        destroyCookie(null, 'token');
        return;
      }

      setUser(user);
      const token = await user.getIdToken();
      setCookie(null, 'token', token, {
        path: '/'
      });
    });

    return () => unsubscribe();
  }, []);

  // force refresh the token every 10 minutes
  useEffect(() => {
    const handle = setInterval(async () => {
      const user = auth.currentUser;
      if (user) await user.getIdToken(true);
    }, 10 * 60 * 1000);

    // clean up setInterval
    return () => clearInterval(handle);
  }, []);

  const login = useCallback(async ({ email, password }: Credentials, persist: boolean) => {
    if (!persist) {
      await setPersistence(auth, browserSessionPersistence);
    }
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithProvider = useCallback(async (provider: FirebaseAuthProvider, persist: boolean) => {
    if (!persist) {
      await setPersistence(auth, browserSessionPersistence);
    }
    return signInWithPopup(auth, provider);
  }, []);

  const signup = useCallback(async ({ email, password }: Credentials, persist: boolean) => {
    if (!persist) {
      await setPersistence(auth, browserSessionPersistence);
    }
    return createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signout = useCallback(() => {
    return signOut(auth).then(() => {
      setUser(null);
      destroyCookie(null, 'token');
    });
  }, []);

  return <AuthContext.Provider value={{ user, login, loginWithProvider, signup, signout }}>{children}</AuthContext.Provider>;
};
