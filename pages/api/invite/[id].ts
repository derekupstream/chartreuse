import type { Invite } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).delete(deleteInvite);

type Response = {
  invite?: Invite;
  error?: string;
};

async function deleteInvite(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const invite = await prisma.invite.delete({
    where: {
      id: req.query.id as string
    }
  });

  return res.status(200).json({ invite });
}

export default handler;
