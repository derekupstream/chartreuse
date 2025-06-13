import { Prisma } from '@prisma/client';
import type { Org, User } from '@prisma/client';
import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

export type UpdateProjectUsageRequest = {
  eventGuestCount?: number;
  reusableReturnPercentage?: number;
};

const handler = handlerWithUser();

export type UserProfile = User & { org: Org };

handler.put(updateProjectUsage);

async function updateProjectUsage(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { eventGuestCount, reusableReturnPercentage, projectId } = req.body;

  if (typeof eventGuestCount === 'number') {
    const project = await prisma.project.update<Prisma.ProjectUpdateArgs>({
      where: {
        id: req.query.id as string
      },
      data: {
        eventGuestCount: eventGuestCount
      }
    });
  }

  if (typeof reusableReturnPercentage === 'number') {
    await prisma.eventFoodwareLineItem.updateMany({
      where: {
        projectId
      },
      data: {
        reusableReturnPercentage
      }
    });
  }

  return res.status(200).end();
}

export default handler;
