// Auth adapter interface - works with both Firebase and Supabase
export interface AuthAdapter {
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(email: string, password: string, name?: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  onAuthChange(callback: (user: AuthUser | null) => void): () => void;
  getIdToken(): Promise<string | null>;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  orgId?: string;
}

// Firebase implementation
export class FirebaseAuthAdapter implements AuthAdapter {
  async signIn(email: string, password: string): Promise<AuthUser> {
    // TODO: Implement Firebase auth logic
    throw new Error('Firebase auth not implemented');
  }

  async signUp(email: string, password: string, name?: string): Promise<AuthUser> {
    // TODO: Implement Firebase auth logic
    throw new Error('Firebase auth not implemented');
  }

  async signOut(): Promise<void> {
    // TODO: Implement Firebase signOut
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // TODO: Implement Firebase getCurrentUser
    return null;
  }

  onAuthChange(callback: (user: AuthUser | null) => void): () => void {
    // TODO: Implement Firebase onAuthChange
    return () => {};
  }

  async getIdToken(): Promise<string | null> {
    // TODO: Implement Firebase getIdToken
    return null;
  }
}

// Supabase implementation
export class SupabaseAuthAdapter implements AuthAdapter {
  constructor(private supabase: any) {}

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name
    };
  }

  async signUp(email: string, password: string, name?: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;

    return {
      id: data.user!.id,
      email: data.user!.email!,
      name: data.user!.user_metadata?.name
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const {
      data: { user }
    } = await this.supabase.auth.getUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name
    };
  }

  onAuthChange(callback: (user: AuthUser | null) => void): () => void {
    const {
      data: { subscription }
    } = this.supabase.auth.onAuthStateChange((_: any, session: any) => {
      callback(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name
            }
          : null
      );
    });

    return () => subscription.unsubscribe();
  }

  async getIdToken(): Promise<string | null> {
    const {
      data: { session }
    } = await this.supabase.auth.getSession();
    return session?.access_token || null;
  }
}

// Factory function
export function createAuthAdapter(provider: 'firebase' | 'supabase', supabaseClient?: any): AuthAdapter {
  if (provider === 'firebase') {
    return new FirebaseAuthAdapter();
  } else {
    if (!supabaseClient) {
      throw new Error('Supabase client is required for Supabase auth adapter');
    }
    return new SupabaseAuthAdapter(supabaseClient);
  }
}
