import type { UserCredential } from 'firebase/auth';
import {
  onIdTokenChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { setCookie, destroyCookie } from 'nookies';
import { createContext, useEffect, useState, useCallback } from 'react';

import type { FirebaseAuthProvider, FirebaseUser } from './firebaseClient';
import { auth } from './firebaseClient';
import { isBlacklistedEmail, assertEmailIsNotBlacklisted } from './userEmailBlacklist';

export type { FirebaseUser };

export type Credentials = {
  email: string;
  password: string;
};

type AuthContextType = {
  firebaseUser: FirebaseUser | null;
  login: (credentials: Credentials, persist: boolean) => Promise<UserCredential | null>;
  loginWithProvider: (provider: FirebaseAuthProvider, persist: boolean) => Promise<UserCredential | null>;
  signup: (credentials: Credentials, persist: boolean) => Promise<UserCredential | null>;
  signout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  login: () => Promise.resolve(null),
  loginWithProvider: () => Promise.resolve(null),
  signup: () => Promise.resolve(null),
  signout: () => Promise.resolve()
});

export const AuthProvider: React.FC<{ children: any }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (_firebaseUser: FirebaseUser | null) => {
      const emailIsBlacklisted = _firebaseUser?.email && isBlacklistedEmail(_firebaseUser.email);
      if (!_firebaseUser || emailIsBlacklisted) {
        console.log('Log user out');
        setFirebaseUser(null);
        destroyCookie(null, 'token');
        return;
      }
      console.log('Log user in');

      setFirebaseUser(_firebaseUser);
      const token = await _firebaseUser.getIdToken();
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
    assertEmailIsNotBlacklisted(email);
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
    assertEmailIsNotBlacklisted(email);
    if (!persist) {
      await setPersistence(auth, browserSessionPersistence);
    }
    return createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signout = useCallback(() => {
    return signOut(auth).then(() => {
      setFirebaseUser(null);
      destroyCookie(null, 'token');
    });
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, login, loginWithProvider, signup, signout }}>
      {children}
    </AuthContext.Provider>
  );
};
