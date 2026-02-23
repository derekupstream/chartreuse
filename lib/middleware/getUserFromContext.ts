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

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: dataToInclude
  });

  return { user, authUser };
}
