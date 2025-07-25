import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

handler.post(updateOrg).use(requireUpstream).delete(deleteOrg);

export type RequestBody = {
  name: string;
  currency: string;
  useMetricSystem: boolean;
  useShrinkageRate: boolean;
};

async function updateOrg(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { name, currency, useMetricSystem, useShrinkageRate } = req.body as RequestBody;

  if (req.user.role !== 'ORG_ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await prisma.org.update({
    where: {
      id: req.user.orgId
    },
    data: {
      name: name.trim(),
      currency: currency,
      useMetricSystem: useMetricSystem,
      useShrinkageRate: useShrinkageRate
    }
  });

  return res.status(200).end();
}

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
