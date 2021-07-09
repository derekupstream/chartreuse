import { createContext, useEffect, useState, useCallback } from "react";
import { firebase, User } from "lib/firebaseClient";
import "firebase/auth";
import { setCookie, destroyCookie } from "nookies";

export type { User };

export type Credentials = {
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  login: (credentials: Credentials) => void;
  signup: (credentials: Credentials) => void;
  signout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async (credentials: Credentials) => {},
  signup: async (credentials: Credentials) => {},
  signout: async () => {},
});

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = firebase
      .auth()
      .onIdTokenChanged(async (user: User | null) => {
        if (!user) {
          setUser(null);
          destroyCookie(null, "token");
          return;
        }

        setUser(user);
        const token = await user.getIdToken();
        setCookie(null, "token", token);
      });

    return () => unsubscribe();
  }, []);

  const login = useCallback(({ email, password }: Credentials) => {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }, []);

  const signup = useCallback(({ email, password }: Credentials) => {
    return firebase.auth().createUserWithEmailAndPassword(email, password);
  }, []);

  const signout = useCallback(() => {
    return firebase
      .auth()
      .signOut()
      .then(() => {
        setUser(null);
        destroyCookie(null, "token");
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, signout }}>
      {children}
    </AuthContext.Provider>
  );
};
