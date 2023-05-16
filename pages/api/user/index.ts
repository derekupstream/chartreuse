import type { Org, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import { defaultHandler } from 'lib/middleware/handler';
import prisma from 'lib/prisma';

const handler = defaultHandler();

export type UserProfile = User & { org: Org };

handler.get(returnUser);

type Response = {
  user?: UserProfile | null;
};

async function returnUser(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (!req.cookies.token) {
    return res.status(204).end();
  }
  const token = await verifyIdToken(req.cookies.token as string);
  const user = await prisma.user.findUnique({
    where: {
      id: token.uid
    },
    include: {
      org: true
    }
  });

  res.status(200).json({ user });
}

export default handler;
