import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

handler.use(requireUpstream).delete(deleteOrg);

async function deleteOrg(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.query.orgId as string;

  if (!orgId) {
    return res.status(400).json({ message: 'Missing orgId' });
  }

  await prisma.org.delete({
    where: {
      id: orgId
    }
  });

  res.status(200).end();
}

export default handler;
