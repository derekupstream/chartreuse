import type { GetServerSideProps } from 'next';

import { createSupabaseServerPropsClient } from 'lib/auth/supabaseServer';
import prisma from 'lib/prisma';

// Handles the OAuth redirect from Supabase after Google sign-in.
// Exchanges the code for a session, then routes to setup or app.
export const getServerSideProps: GetServerSideProps = async context => {
  const { code } = context.query;

  if (typeof code === 'string') {
    const supabase = createSupabaseServerPropsClient(context);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const existingUser = await prisma.user.findUnique({ where: { id: data.user.id } });
      if (!existingUser) {
        return { redirect: { permanent: false, destination: '/setup/trial' } };
      }
      return { redirect: { permanent: false, destination: '/projects' } };
    }
  }

  return { redirect: { permanent: false, destination: '/login' } };
};

export default function AuthCallback() {
  return null;
}
