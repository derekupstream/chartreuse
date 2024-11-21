import type { Prisma, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import prisma from 'lib/prisma';

export type NextApiRequestWithUser = NextApiRequest & {
  user: User;
};

export async function getUser(req: NextApiRequestWithUser, res: NextApiResponse, next: () => void) {
  const cookies = req.cookies;
  const token = await verifyIdToken(cookies.token);

  const user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({
    where: {
      id: token.uid
    }
  });
  if (!user) {
    res.status(401).send('User not found');
  } else {
    req.user = user;
    next();
  }
}

export default getUser;
