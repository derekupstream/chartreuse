import { PrismaClient } from '@prisma/client'

declare global {
  //var prisma: PrismaClient - dont add this or we may forget to import prisma in a file
}

let prisma: PrismaClient

// create single instance of prisma for development: https://github.com/prisma/prisma/issues/1983
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  // @ts-expect-error
  if (!global.prisma) {
    // @ts-expect-error
    global.prisma = new PrismaClient()
  }
}
// @ts-expect-error
export default prisma
