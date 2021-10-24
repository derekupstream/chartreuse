import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'
import methodRouter from 'lib/middleware/method-router'

const handlers = methodRouter({
  async GET(req, res) {
    const projectId = req.query.id as string
    const additionalCosts = await prisma.additionalCost.findMany<Prisma.AdditionalCostFindManyArgs>({
      where: {
        projectId,
      },
    })
    res.status(200).json({ additionalCosts })
  },

  async POST(req, res) {
    try {
      const additionalCost = await prisma.additionalCost.create<Prisma.AdditionalCostCreateArgs>({
        data: req.body,
      })

      res.status(200).json({ additionalCost })
    } catch (error: any) {
      console.error('Error saving additional cost', error)
      res.status(500).json({ error: error.message })
    }
  },

  async DELETE(req, res) {
    try {
      await prisma.additionalCost.delete<Prisma.AdditionalCostDeleteArgs>({
        where: {
          id: req.body.id,
        },
      })
      res.status(200)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  },
})

export default handlers
