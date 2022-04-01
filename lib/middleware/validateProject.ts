import { NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { NextApiRequestWithUser } from './getUser'

// this method requires getUser middleware to be run first
export async function validateProject(req: NextApiRequestWithUser, res: NextApiResponse, next: Function) {
  const projectId = (req.query.projectId || req.body.projectId || req.query.id) as string
  if (!projectId) {
    res.status(400).send('Missing projectId')
    return
  }
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
  })
  if (!project) {
    res.status(404).send('Project not found')
  } else if (project.orgId !== req.user.orgId) {
    res.status(403).send('Project not in org')
  } else if (req.user.accountId && req.user.accountId !== project.accountId) {
    res.status(403).send('Project not in account')
  } else {
    next()
  }
}
