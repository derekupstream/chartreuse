import prisma from 'lib/prisma'
import { Prisma, SingleUseLineItem } from '@prisma/client'
import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import getUser, { NextApiRequestWithUser } from 'lib/middleware/getUser'
import onError from 'lib/middleware/onError'
import onNoMatch from 'lib/middleware/onNoMatch'
import { validateProject } from 'lib/middleware/validateProject'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getItems).post(addItem).delete(deleteItem)

async function getItems(req: NextApiRequestWithUser, res: NextApiResponse<{ lineItems?: SingleUseLineItem[] }>) {
  const projectId = req.query.id as string
  const lineItems = await prisma.singleUseLineItem.findMany<Prisma.SingleUseLineItemFindManyArgs>({
    where: {
      projectId,
    },
  })
  res.status(200).json({ lineItems })
}

async function addItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  const lineItem = await prisma.singleUseLineItem.create<Prisma.SingleUseLineItemCreateArgs>({
    data: req.body,
  })
  res.status(200).json({ lineItem })
}

async function deleteItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  console.log('delete item')
  await prisma.singleUseLineItem.delete<Prisma.SingleUseLineItemDeleteArgs>({
    where: {
      id: req.body.id,
    },
  })
  res.status(200).json({ success: true })
}

export default handler
