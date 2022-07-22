import getSingleUseItems from 'inventory/getSingleUseItems'
import { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).get(getSingleUseItemsMiddlware)

async function getSingleUseItemsMiddlware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.user.orgId
  const products = await getSingleUseItems({ orgId })
  res.json(products)
}

export default handler
