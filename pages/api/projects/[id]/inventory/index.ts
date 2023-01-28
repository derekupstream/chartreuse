import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import getUser, { NextApiRequestWithUser } from 'lib/middleware/getUser'
import onError from 'lib/middleware/onError'
import onNoMatch from 'lib/middleware/onNoMatch'
import { validateProject } from 'lib/middleware/validateProject'

import { ProjectInventory } from 'lib/inventory/types/projects'
import { getProjectInventory } from 'lib/inventory/getProjectInventory'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getItems)

async function getItems(req: NextApiRequestWithUser, res: NextApiResponse<ProjectInventory>) {
  const projectId = req.query.id as string

  const inventory = await getProjectInventory(projectId)

  res.status(200).json(inventory)
}

export default handler
