import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma, Project } from '@prisma/client'
import { ProjectMetadata } from 'components/dashboard/projects/steps/setup'
import getUser, { NextApiRequestWithUser } from 'lib/middleware/getUser'
import onError from 'lib/middleware/onError'
import onNoMatch from 'lib/middleware/onNoMatch'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).get(getProjects).post(createProject)

async function createProject(req: NextApiRequestWithUser, res: NextApiResponse<{ project: Project }>) {
  const { name, metadata, accountId } = req.body

  const project = await prisma.project.create<Prisma.ProjectCreateArgs>({
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
  })

  return res.status(200).json({ project })
}

async function getProjects(req: NextApiRequestWithUser, res: NextApiResponse<{ projects: Project[] }>) {
  const projects = await prisma.project.findMany<Prisma.ProjectFindManyArgs>({
    where: {
      accountId: req.user.accountId || undefined,
      orgId: req.user.orgId,
    },
  })

  return res.status(200).json({ projects })
}
