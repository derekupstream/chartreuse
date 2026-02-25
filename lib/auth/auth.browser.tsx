import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useEffect, useState } from 'react';

import { createSupabaseBrowserClient } from './supabaseClient';

// SessionUser maps Supabase User to the shape components expect
export type SessionUser = {
  uid: string;
  email: string;
  displayName: string | null;
};

export type { SessionUser as FirebaseUser }; // backward-compat alias

function toSessionUser(user: User): SessionUser {
  return {
    uid: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null
  };
}

type AuthContextType = {
  firebaseUser: SessionUser | null;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  signout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  signInWithGoogle: () => Promise.resolve(),
  signInWithPassword: () => Promise.resolve(null),
  resetPassword: () => Promise.resolve(null),
  signout: () => Promise.resolve()
});

export const AuthProvider: React.FC<{ children: any }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<SessionUser | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Bypass for local dev remote user
    if (process.env.NEXT_PUBLIC_REMOTE_USER_ID || process.env.NEXT_PUBLIC_REMOTE_USER_EMAIL) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setFirebaseUser(toSessionUser(session.user));
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setFirebaseUser(toSessionUser(session.user));
      } else {
        setFirebaseUser(null);
        if (typeof window !== 'undefined' && !isPublicUrl(window.location.href)) {
          window.location.href = '/login';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`
    });
    return error ? error.message : null;
  }, []);

  const signout = useCallback(async () => {
    await supabase.auth.signOut();
    setFirebaseUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, signInWithGoogle, signInWithPassword, resetPassword, signout }}>
      {children}
    </AuthContext.Provider>
  );
};

function isPublicUrl(url: string) {
  return ['login', 'share', 'auth/callback'].some(path => url.includes(path));
}
