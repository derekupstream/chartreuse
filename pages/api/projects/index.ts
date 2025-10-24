import type { Account, Project, ProjectTagRelation } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectMetadata } from 'components/projects/[id]/edit/ProjectSetup';
import type { ProjectInput } from 'lib/chartreuseClient';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import getUser from 'lib/middleware/getUser';
import onError from 'lib/middleware/onError';
import onNoMatch from 'lib/middleware/onNoMatch';
import prisma from 'lib/prisma';
import { trackEvent } from 'lib/tracking';
import { isEventProjectsEnabledForOrg } from 'lib/isEventProjectsEnabledForOrg';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(getProjects).post(createProject).delete(deleteProject);

export type PopulatedProject = Project & { account: Account; tags: ProjectTagRelation[] };

async function createProject(req: NextApiRequestWithUser, res: NextApiResponse<{ project: Project }>) {
  const {
    category,
    name,
    metadata,
    location,
    accountId,
    USState,
    currency,
    utilityRates,
    templateDescription,
    tagIds = [],
    isTemplate
  } = req.body as ProjectInput;

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
    if (
      typeof utilityRates.water !== 'number' ||
      typeof utilityRates.electric !== 'number' ||
      typeof utilityRates.gas !== 'number'
    ) {
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
      location,
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
      org: true,
      tags: true
    }
  });

  // Connect tags after project creation
  await prisma.projectTagRelation.createMany({
    data: tagIds.map(tagId => ({ projectId: project.id, tagId }))
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
      account: true,
      tags: true
    },
    orderBy: {
      createdAt: 'desc'
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
