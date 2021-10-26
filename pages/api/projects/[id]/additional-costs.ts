import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'
import methodRouter from 'lib/middleware/method-router'
import { CreateAdditionalCostValidator } from 'lib/validators'

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
    const data = {
      projectId: req.body.projectId,
      cost: req.body.cost,
      frequency: String(req.body.frequency),
      categoryId: req.body.categoryId,
    }

    CreateAdditionalCostValidator.parse(data)

    // @todo validate that project ID exists and belongs to current user

    try {
      const additionalCost = await prisma.additionalCost.create<Prisma.AdditionalCostCreateArgs>({
        data,
      })

      res.status(200).json({ additionalCost })
    } catch (error: any) {
      console.error('Error saving additional cost', error)
      res.status(500).json({ error: error.message })
    }
  },

  async DELETE(req, res) {
    // @todo validate the project belongs to current user
    // @todo get project id from URL instead of parsing out of body
    try {
      await prisma.additionalCost.delete<Prisma.AdditionalCostDeleteArgs>({
        where: {
          id: req.body.id,
        },
      })
      res.status(200)
    } catch (error: any) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  },
})

export default handlers
