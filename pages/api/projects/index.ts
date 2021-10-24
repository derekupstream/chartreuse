import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma, Project } from '@prisma/client'
import { ProjectMetadata } from 'components/dashboard/projects/steps/setup'

type Response = {
  project?: Project
  projects?: Project[]
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method === 'POST') {
    try {
      const { name, metadata, accountId, orgId } = req.body

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
              id: orgId,
            },
          },
        },
      })

      return res.status(200).json({ project })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'GET') {
    try {
      const projects = await prisma.project.findMany<Prisma.ProjectFindManyArgs>()

      return res.status(200).json({ projects })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: 'Method not allowed' })
}
