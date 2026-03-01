import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

handler.get(getOrg).post(updateOrg).use(requireUpstream).delete(deleteOrg);

async function getOrg(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { orgId } = req.query;
  if (req.user.orgId !== orgId) return res.status(403).json({ message: 'Forbidden' });

  const org = await prisma.org.findUnique({
    where: { id: orgId as string },
    select: {
      id: true,
      name: true,
      currency: true,
      useMetricSystem: true,
      useShrinkageRate: true,
      orgType: true,
      country: true,
      city: true,
      employeeCount: true,
      locationCount: true,
      reuseJourneyStage: true,
      primaryChallenge: true
    }
  });

  if (!org) return res.status(404).json({ message: 'Not found' });
  return res.json(org);
}

export type RequestBody = {
  name?: string;
  currency?: string;
  useMetricSystem?: boolean;
  useShrinkageRate?: boolean;
  orgType?: string;
  country?: string;
  city?: string;
  employeeCount?: string;
  locationCount?: string;
  reuseJourneyStage?: string;
  primaryChallenge?: string;
};

async function updateOrg(req: NextApiRequestWithUser, res: NextApiResponse) {
  const {
    name,
    currency,
    useMetricSystem,
    useShrinkageRate,
    orgType,
    country,
    city,
    employeeCount,
    locationCount,
    reuseJourneyStage,
    primaryChallenge
  } = req.body as RequestBody;

  if (req.user.role !== 'ORG_ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await prisma.org.update({
    where: { id: req.user.orgId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(useMetricSystem !== undefined ? { useMetricSystem } : {}),
      ...(useShrinkageRate !== undefined ? { useShrinkageRate } : {}),
      ...(orgType !== undefined ? { orgType } : {}),
      ...(country !== undefined ? { country } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(employeeCount !== undefined ? { employeeCount } : {}),
      ...(locationCount !== undefined ? { locationCount } : {}),
      ...(reuseJourneyStage !== undefined ? { reuseJourneyStage } : {}),
      ...(primaryChallenge !== undefined ? { primaryChallenge } : {})
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
