import type { Prisma, Project } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { ProjectMetadata } from 'components/projects/[id]/edit';
import type { ProjectInput } from 'lib/chartreuseClient';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import getUser from 'lib/middleware/getUser';
import onError from 'lib/middleware/onError';
import onNoMatch from 'lib/middleware/onNoMatch';
import prisma from 'lib/prisma';
import { trackEvent } from 'lib/tracking';
const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getProjects).post(createProject);

async function createProject(req: NextApiRequestWithUser, res: NextApiResponse<{ project: Project }>) {
  const { name, metadata, accountId, USState, currency, utilityRates } = req.body as ProjectInput;

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
    throw new Error('Must set either US state or utility rates');
  }

  const project = await prisma.project.create({
    data: {
      name,
      metadata: metadata as ProjectMetadata,
      USState: USState || undefined,
      currency,
      utilityRates: utilityRates || undefined,
      account: {
        connect: {
          id: accountId
        }
      },
      org: {
        connect: {
          id: req.user.orgId!
        }
      }
    },
    include: {
      org: true
    }
  });

  await trackEvent({
    type: 'create_project',
    userId: req.user.id,
    props: {
      projectName: project.name
    }
  });

  return res.status(200).json({ project });
}

async function getProjects(req: NextApiRequestWithUser, res: NextApiResponse<{ projects: Project[] }>) {
  const projects = await prisma.project.findMany<Prisma.ProjectFindManyArgs>({
    where: {
      accountId: req.user.accountId || undefined,
      orgId: req.user.orgId
    },
    include: {
      account: true
    }
  });

  return res.status(200).json({ projects });
}

export default handler;
