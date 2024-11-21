import type { UserCredential } from 'firebase/auth';
import {
  onIdTokenChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
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

      if (process.env.NEXT_PUBLIC_REMOTE_USER_ID) {
        // ignore firebase auth for remote user
        return;
      }

      if (!_firebaseUser || emailIsBlacklisted) {
        console.log('TODO: Log user out');
        // for some reason, _firebaseUser is null when the user is logged out
        setFirebaseUser(null);
        destroyCookie(null, 'token', {
          path: '/' // setting path is required or this wont work
        });
        if (!isPublicUrl(window.location.href)) {
          console.log('Send user to login');
          window.location.href = '/login';
        }
        return;
      }

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
    const handle = setInterval(
      async () => {
        const user = auth.currentUser;
        if (user) await user.getIdToken(true);
      },
      10 * 60 * 1000
    );

    // clean up setInterval
    return () => clearInterval(handle);
  }, []);

  const login = useCallback(async ({ email, password }: Credentials, persist: boolean) => {
    assertEmailIsNotBlacklisted(email);
    console.log('LOGIN', { email, password, persist });
    if (!persist) {
      await setPersistence(auth, browserLocalPersistence);
    }
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithProvider = useCallback(async (provider: FirebaseAuthProvider, persist: boolean) => {
    if (!persist) {
      await setPersistence(auth, browserLocalPersistence);
    }
    return signInWithPopup(auth, provider);
  }, []);

  const signup = useCallback(async ({ email, password }: Credentials, persist: boolean) => {
    assertEmailIsNotBlacklisted(email);
    if (!persist) {
      await setPersistence(auth, browserLocalPersistence);
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

function isPublicUrl(url: string) {
  return ['login', 'share'].some(path => url.includes(path));
}
