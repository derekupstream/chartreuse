import type { GetServerSideProps } from 'next';

import { createSupabaseServerPropsClient } from 'lib/auth/supabaseServer';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  const { code } = context.query;

  if (typeof code === 'string') {
    try {
      const supabase = createSupabaseServerPropsClient(context);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user) {
        console.error('exchangeCodeForSession error:', error);
        return { redirect: { permanent: false, destination: '/login?error=auth' } };
      }

      const { id: supabaseId, email } = data.user;

      // Check if a user record already exists with this Supabase ID
      const userById = await prisma.user.findUnique({ where: { id: supabaseId } });
      if (userById) {
        return { redirect: { permanent: false, destination: '/projects' } };
      }

      // Check if a seeded user exists with the same email (Firebase-era ID)
      if (email) {
        const userByEmail = await prisma.user.findUnique({ where: { email } });
        if (userByEmail && userByEmail.id !== supabaseId) {
          // Re-link the existing account to this Supabase ID via raw SQL
          // (Prisma doesn't allow updating @id fields directly)
          await prisma.$executeRaw`UPDATE "User" SET id = ${supabaseId} WHERE id = ${userByEmail.id}`;
          return { redirect: { permanent: false, destination: '/projects' } };
        }
      }

      // New user — send to account setup
      return { redirect: { permanent: false, destination: '/setup/trial' } };
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
