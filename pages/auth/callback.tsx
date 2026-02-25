import type { GetServerSideProps } from 'next';

import { createSupabaseServerPropsClient } from 'lib/auth/supabaseServer';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  const { code } = context.query;

  if (typeof code === 'string') {
    const supabase = createSupabaseServerPropsClient(context);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error('exchangeCodeForSession error:', error);
      return { redirect: { permanent: false, destination: '/login?error=auth' } };
    }

    // Auth succeeded — now try to find/link the DB user
    const { id: supabaseId, email } = data.user;

    try {
      const userById = await prisma.user.findUnique({ where: { id: supabaseId } });
      if (userById) {
        return { redirect: { permanent: false, destination: '/projects' } };
      }

      if (email) {
        const userByEmail = await prisma.user.findUnique({ where: { email } });
        if (userByEmail && userByEmail.id !== supabaseId) {
          await prisma.$executeRaw`UPDATE "User" SET id = ${supabaseId} WHERE id = ${userByEmail.id}`;
          return { redirect: { permanent: false, destination: '/projects' } };
        }
      }

      return { redirect: { permanent: false, destination: '/setup/trial' } };
    } catch (err) {
      // Auth worked but DB lookup failed — still send to projects,
      // getUserFromContext will handle linking on next request
      console.error('Auth callback DB error:', err);
      return { redirect: { permanent: false, destination: '/projects' } };
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
