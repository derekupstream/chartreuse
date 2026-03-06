import type { Prisma, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { createSupabaseApiClient } from 'lib/auth/supabaseServer';
import prisma from 'lib/prisma';

export type NextApiRequestWithUser = NextApiRequest & {
  user: User;
};

export async function getUser(req: NextApiRequestWithUser, res: NextApiResponse, next: () => void) {
  const supabase = createSupabaseApiClient(req, res);
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser) {
    res.status(401).send('Unauthorized');
    return;
  }

  let user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({
    where: { id: authUser.id }
  });

  // If not found by Supabase UUID, try to re-link from seeded/Firebase-era record by email
  if (!user && authUser.email) {
    const userByEmail = await prisma.user.findUnique({ where: { email: authUser.email } });
    if (userByEmail) {
      await prisma.$executeRaw`UPDATE "User" SET id = ${authUser.id} WHERE id = ${userByEmail.id}`;
      user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({ where: { id: authUser.id } });
    }
  }

  if (!user) {
    res.status(401).send('User not found');
    return;
  }

  req.user = user;
  next();
}

export default getUser;
