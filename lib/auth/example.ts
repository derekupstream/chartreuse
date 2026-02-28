// Example usage in a React component or API route
import { getAuthAdapter, type AuthUser } from './config';

// For Supabase, you'd pass the client
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

// In your component:
export async function signInUser(email: string, password: string): Promise<AuthUser> {
  const authAdapter = getAuthAdapter(supabase); // Pass supabase client for Supabase, undefined for Firebase
  return await authAdapter.signIn(email, password);
}

// In your API middleware:
export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const authAdapter = getAuthAdapter(supabase);
  return await authAdapter.getCurrentUser();
}

// Environment variables needed:
// AUTH_PROVIDER=supabase (or firebase)
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// SUPABASE_SERVICE_KEY=your_supabase_service_key
// For Firebase: FIREBASE_CONFIG=your_firebase_config
