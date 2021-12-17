import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { validateProject } from 'lib/middleware/validateProject'
import { getProjections, ProjectionsResponse } from 'internal-api/calculator'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getProjectionsHandler)

async function getProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse<ProjectionsResponse>) {
  const projectId = req.query.projectId as string
  const results = await getProjections(projectId)
  res.json(results)
}

export default handler
