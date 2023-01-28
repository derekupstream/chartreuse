import type { NextApiResponse } from 'next'
import { projectHandler, NextApiRequestWithUser } from 'lib/middleware'
import { getProjections, ProjectionsResponse } from 'lib/calculator/getProjections'

const handler = projectHandler()

handler.get(getProjectionsHandler)

async function getProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse<ProjectionsResponse>) {
  const projectId = req.query.projectId as string
  const results = await getProjections(projectId)
  res.json(results)
}

export default handler
