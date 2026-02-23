import type { GetServerSideProps } from 'next';

import { createSupabaseServerPropsClient } from 'lib/auth/supabaseServer';

// Handles the OAuth redirect from Supabase after Google sign-in.
// Exchanges the code for a session, then routes to setup.
// The /setup/trial page handles routing existing users to /projects.
export const getServerSideProps: GetServerSideProps = async context => {
  const { code } = context.query;

  if (typeof code === 'string') {
    try {
      const supabase = createSupabaseServerPropsClient(context);
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return { redirect: { permanent: false, destination: '/setup/trial' } };
      }

      console.error('exchangeCodeForSession error:', error);
    } catch (err) {
      console.error('Auth callback error:', err);
    }
  }

  return { redirect: { permanent: false, destination: '/login?error=auth' } };
};

export default function AuthCallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Signing you in...</p>
    </div>
  );
}
