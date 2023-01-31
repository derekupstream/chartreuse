import type { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).put(updateAccount).delete(deleteAccount);

async function updateAccount(req: NextApiRequestWithUser, res: NextApiResponse) {
  const account = await prisma.account.update<Prisma.AccountUpdateArgs>({
    where: {
      id: req.query.id as string
    },
    data: {
      name: req.body.name,
      USState: req.body.USState
    }
  });

  return res.status(200).json({ account });
}

async function deleteAccount(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.account.deleteMany({
    where: {
      id: req.query.id as string,
      orgId: req.user.orgId
    }
  });

  return res.status(200).end();
}

export default handler;
