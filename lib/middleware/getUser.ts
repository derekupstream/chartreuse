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

  const user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({
    where: { id: authUser.id }
  });

  if (!user) {
    res.status(401).send('User not found');
    return;
  }

  req.user = user;
  next();
}

export default getUser;
