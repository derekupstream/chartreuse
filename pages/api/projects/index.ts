import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma, Project } from '@prisma/client'
import { ProjectMetadata } from 'components/calculator/setup'
import getUser, { NextApiRequestWithUser } from 'lib/middleware/getUser'
import onError from 'lib/middleware/onError'
import onNoMatch from 'lib/middleware/onNoMatch'
import { trackEvent } from 'lib/tracking'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).get(getProjects).post(createProject)

async function createProject(req: NextApiRequestWithUser, res: NextApiResponse<{ project: Project }>) {
  const { name, metadata, accountId } = req.body

  const project = await prisma.project.create({
    data: {
      name,
      metadata: metadata as ProjectMetadata,
      account: {
        connect: {
          id: accountId,
        },
      },
      org: {
        connect: {
          id: req.user.orgId!,
        },
      },
    },
    include: {
      org: true,
    },
  })

  await trackEvent({
    type: 'create_project',
    orgName: project.org.name,
    projectName: project.name,
    userEmail: req.user.email,
  })

  return res.status(200).json({ project })
}

async function getProjects(req: NextApiRequestWithUser, res: NextApiResponse<{ projects: Project[] }>) {
  const projects = await prisma.project.findMany<Prisma.ProjectFindManyArgs>({
    where: {
      accountId: req.user.accountId || undefined,
      orgId: req.user.orgId,
    },
    include: {
      account: true,
    },
  })

  return res.status(200).json({ projects })
}

export default handler
