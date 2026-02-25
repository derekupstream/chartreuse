import type { Prisma } from '@prisma/client';
import type { GetServerSidePropsContext } from 'next';

import { createSupabaseServerPropsClient } from 'lib/auth/supabaseServer';
import prisma from 'lib/prisma';

import { UserDataToInclude } from './getProjectContext';

export async function getUserFromContext<T extends Partial<Prisma.UserInclude> = any>(
  context: GetServerSidePropsContext,
  dataToInclude: T = null as unknown as T
) {
  const supabase = createSupabaseServerPropsClient(context);
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {};
  }

  let user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: dataToInclude
  });

  // If no user found by Supabase ID, check for a seeded account with the same email
  // (Firebase-era records have old IDs — re-link them to the new Supabase UUID)
  if (!user && authUser.email) {
    const userByEmail = await prisma.user.findUnique({ where: { email: authUser.email } });
    if (userByEmail) {
      await prisma.$executeRaw`UPDATE "User" SET id = ${authUser.id} WHERE id = ${userByEmail.id}`;
      user = await prisma.user.findUnique({ where: { id: authUser.id }, include: dataToInclude });
    }
  }

  return { user, authUser };
}
