import type { Account, Project } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { ProjectMetadata } from 'components/projects/[id]/edit/ProjectSetup';
import type { ProjectInput } from 'lib/chartreuseClient';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import getUser from 'lib/middleware/getUser';
import onError from 'lib/middleware/onError';
import onNoMatch from 'lib/middleware/onNoMatch';
import prisma from 'lib/prisma';
import { trackEvent } from 'lib/tracking';
import { isEventProjectsEnabledForOrg } from 'lib/featureFlags';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getProjects).post(createProject).delete(deleteProject);

export type PopulatedProject = Project & { account: Account };

async function createProject(req: NextApiRequestWithUser, res: NextApiResponse<{ project: Project }>) {
  const { category, name, metadata, accountId, USState, currency, utilityRates, templateDescription, isTemplate } =
    req.body as ProjectInput;

  const isEventProjectsEnabled = await isEventProjectsEnabledForOrg({ orgId: req.user.orgId! });
  const categorySafe = isEventProjectsEnabled ? category : 'default';

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

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      metadata: metadata as ProjectMetadata,
      USState: USState || undefined,
      currency,
      utilityRates: utilityRates || undefined,
      isTemplate: isTemplate,
      templateDescription: templateDescription || undefined,
      category: categorySafe,
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

async function getProjects(req: NextApiRequestWithUser, res: NextApiResponse<{ projects: PopulatedProject[] }>) {
  const projects = await prisma.project.findMany({
    where: {
      accountId: req.user.accountId || undefined,
      orgId: req.user.orgId,
      isTemplate: false
    },
    include: {
      account: true
    }
  });

  return res.status(200).json({ projects });
}

async function deleteProject(req: NextApiRequestWithUser, res: NextApiResponse) {
  const projectId = req.body.id;
  if (typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Missing project ID' });
  }
  await prisma.project.delete({
    where: {
      id: projectId
    }
  });
  console.log('Deleted project', { projectId });

  return res.status(200).json({ ok: true });
}

export default handler;
