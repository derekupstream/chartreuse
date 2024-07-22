import { Prisma } from '@prisma/client';
import type { Project } from '@prisma/client';
import type { Org, User } from '@prisma/client';
import type { NextApiResponse } from 'next';

import type { ProjectMetadata } from 'components/projects/[id]/edit';
import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

export type UserProfile = User & { org: Org };

handler.put(updateProject).delete(deleteProject);

type Response = {
  project?: Project;
};

async function deleteProject(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const project = await prisma.project.delete<Prisma.ProjectDeleteArgs>({
    where: {
      id: req.query.id as string
    }
  });

  return res.status(200).json({ project });
}

async function updateProject(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const {
    name,
    metadata,
    accountId,
    USState,
    orgId,
    currency,
    utilityRates,
    budget,
    singleUseReductionPercentage,
    isTemplate,
    templateDescription
  } = req.body;

  if (USState) {
    if (utilityRates) {
      throw new Error('Cannot set both US state and utility rates');
    }
  } else if (utilityRates) {
    if (USState) {
      throw new Error('Cannot set both US state and utility rates');
    }
    if (!utilityRates.water || !utilityRates.electric || !utilityRates.gas) {
      throw new Error('Must set water, electric, and gas rates');
    }
  } else {
    throw new Error('Please enter utility rates');
  }

  const project = await prisma.project.update<Prisma.ProjectUpdateArgs>({
    where: {
      id: req.query.id as string
    },
    data: {
      name: name.trim(),
      metadata: metadata as ProjectMetadata,
      USState,
      currency,
      utilityRates: utilityRates || Prisma.JsonNull,
      budget,
      isTemplate: isTemplate,
      templateDescription: templateDescription || undefined,
      singleUseReductionPercentage,
      account: {
        connect: {
          id: accountId
        }
      },
      org: {
        connect: {
          id: orgId
        }
      }
    }
  });

  return res.status(200).json({ project });
}

export default handler;
