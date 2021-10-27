import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma, ReusableLineItem } from '@prisma/client'

type Response = {
  lineItem?: ReusableLineItem
  lineItems?: ReusableLineItem[]
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  const projectId = req.query.id as string

  if (req.method === 'GET') {
    const lineItems = await prisma.reusableLineItem.findMany<Prisma.ReusableLineItemFindManyArgs>({
      where: {
        projectId,
      },
    })

    return res.status(200).json({ lineItems })
  } else if (req.method === 'POST') {
    try {
      const lineItem = await prisma.reusableLineItem.create<Prisma.ReusableLineItemCreateArgs>({
        data: req.body,
      })

      return res.status(200).json({ lineItem })
    } catch (error: any) {
      console.error('Error saving reusable item', error)
      return res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      const lineItem = await prisma.reusableLineItem.delete({
        where: { id: req.body.id },
      })
      return res.status(200).json({ lineItem })
    } catch (error: any) {
      console.log(error)
      return res.status(500).json({ error: error.message })
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: 'Method not allowed' })
}
