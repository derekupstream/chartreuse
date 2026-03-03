import type { NextApiResponse } from 'next';

import prisma from 'lib/prisma';

import type { NextApiRequestWithUser } from './getUser';

// this method requires getUser middleware to be run first
export async function validateProject(req: NextApiRequestWithUser, res: NextApiResponse, next: () => void) {
  const projectId = (req.query.projectId || req.body.projectId || req.query.id || req.body.id) as string;
  if (!projectId) {
    res.status(400).send('Missing projectId');
    return;
  }

  const [project, upstreamCount] = await Promise.all([
    prisma.project.findFirst({ where: { id: projectId } }),
    prisma.org.count({ where: { id: req.user.orgId, isUpstream: true } })
  ]);

  const isUpstreamUser = upstreamCount > 0;
  const isAccessibleTemplate = project?.isTemplate;

  if (!project) {
    res.status(404).send('Project not found');
  } else if (isUpstreamUser && req.method === 'GET') {
    // upstream admins can read any project
    next();
  } else if (isAccessibleTemplate && req.method === 'GET') {
    // allow access to read template data
    next();
  } else if (project.orgId !== req.user.orgId) {
    res.status(403).send('Project not in org');
  } else if (req.user.accountId && req.user.accountId !== project.accountId) {
    res.status(403).send('Project not in account');
  } else {
    next();
  }
}
