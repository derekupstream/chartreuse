import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import getUser from 'lib/middleware/getUser';
import onError from 'lib/middleware/onError';
import onNoMatch from 'lib/middleware/onNoMatch';
import prisma from 'lib/prisma';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

// POST toggles the vote. If user has voted, removes the vote. If not, adds it.
handler.use(getUser).post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const id = req.query.id as string;
  const userId = req.user.id;
  const existing = await prisma.featureVote.findUnique({
    where: { featureRequestId_userId: { featureRequestId: id, userId } }
  });
  if (existing) {
    await prisma.featureVote.delete({ where: { id: existing.id } });
    return res.status(200).json({ voted: false });
  }
  await prisma.featureVote.create({ data: { featureRequestId: id, userId } });
  return res.status(200).json({ voted: true });
});

export default handler;
