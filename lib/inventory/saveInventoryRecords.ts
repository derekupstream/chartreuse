import prisma from 'lib/prisma'
import { PrismaPromise } from '@prisma/client'

export interface SingleUseRecord {
  entryDate: string
  caseCost: number
  casesPurchased: number
  unitsPerCase: number
}

export interface InventoryInput {
  singleUseItems: {
    id: string
    records: SingleUseRecord[]
  }[]
}

export async function saveInventoryRecords(projectId: string, inventoryInput: InventoryInput) {
  // create or update records
  const singleUseItemUpdates: PrismaPromise<any>[] = inventoryInput.singleUseItems
    .map(item => {
      return item.records.map(record => {
        const entryDate = new Date(record.entryDate)
        return prisma.singleUseLineItemRecord.upsert({
          where: {
            singleUseLineItemId_entryDate: {
              entryDate,
              singleUseLineItemId: item.id,
            },
          },
          create: {
            ...record,
            entryDate,
            singleUseLineItem: {
              connect: {
                id: item.id,
              },
            },
          },
          update: {
            ...record,
            entryDate,
          },
        })
      })
    })
    .flat()

  // reset all records for this project
  // TODO: save backups in the cloud
  singleUseItemUpdates.unshift(
    prisma.singleUseLineItemRecord.deleteMany({
      where: {
        singleUseLineItem: {
          projectId,
        },
      },
    })
  )

  const r = await prisma.$transaction(singleUseItemUpdates)
  console.log(r)
  console.log('Inventory Records saved', { count: r.length - 1 })
}
