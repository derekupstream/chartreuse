import type { Org, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

export type UserProfile = User & { org: Org };

handler.put(updateUser).delete(deleteUser);

type Response = {
  user?: UserProfile | null;
};

async function updateUser(req: NextApiRequest, res: NextApiResponse<Response>) {
  const user = await prisma.user.update({
    where: {
      id: req.query.id as string
    },
    data: {
      name: req.body.name,
      email: req.body.email,
      title: req.body.title,
      phone: req.body.phone,
      account: req.body.accountId
        ? {
            connect: {
              id: req.body.accountId
            }
          }
        : undefined
    },
    include: {
      org: true
    }
  });

  res.status(200).json({ user });
}

async function deleteUser(req: NextApiRequest, res: NextApiResponse) {
  await prisma.user.delete({
    where: {
      id: req.query.id as string
    }
  });

  res.status(200).end();
}
