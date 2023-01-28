import type { NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { projectHandler, NextApiRequestWithUser } from 'lib/middleware'
import { ReusableLineItem } from '@prisma/client'

const handler = projectHandler()

handler.get(getItems).post(addItem).delete(deleteItem)

async function getItems(req: NextApiRequestWithUser, res: NextApiResponse<{ lineItems?: ReusableLineItem[] }>) {
  const projectId = req.query.id as string

  const lineItems = await prisma.reusableLineItem.findMany({
    where: {
      projectId,
    },
  })

  return res.status(200).json({ lineItems })
}

async function addItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  let lineItem: ReusableLineItem

  if (req.body.id) {
    lineItem = await prisma.reusableLineItem.update({
      where: {
        id: req.body.id,
      },
      data: req.body,
    })
  } else {
    lineItem = await prisma.reusableLineItem.create({
      data: req.body,
    })
  }

  res.status(200).json({ lineItem })
}

async function deleteItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  const lineItem = await prisma.reusableLineItem.delete({
    where: { id: req.body.id },
  })
  return res.status(200).json({ lineItem })
}

export default handler
