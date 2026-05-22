import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

export type AdminJoinRequest = {
  id: string;
  email: string;
  name: string;
  message: string | null;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
};

const handler = handlerWithUser();

async function listForOrg(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.user.role !== 'ORG_ADMIN') {
    return res.status(403).json({ error: 'Only org admins can view join requests' });
  }
  const requests = await prisma.joinRequest.findMany({
    where: { orgId: req.user.orgId, status: 'pending' },
    orderBy: { createdAt: 'desc' }
  });
  return res.status(200).json({
    items: requests.map(r => ({
      id: r.id,
      email: r.email,
      name: r.name,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString()
    })) satisfies AdminJoinRequest[]
  });
}

handler.get(listForOrg);
export default handler;
