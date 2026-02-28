import { createAuthAdapter, AuthAdapter } from './adapter';

// Environment-based auth configuration
const AUTH_PROVIDER = process.env.AUTH_PROVIDER || 'firebase'; // 'firebase' | 'supabase'

let authAdapter: AuthAdapter | null = null;

export function getAuthAdapter(supabaseClient?: any): AuthAdapter {
  if (!authAdapter) {
    authAdapter = createAuthAdapter(AUTH_PROVIDER as 'firebase' | 'supabase', supabaseClient);
  }
  return authAdapter;
}

// Export for convenience in components
export type { AuthAdapter } from './adapter';
export type { AuthUser } from './adapter';
