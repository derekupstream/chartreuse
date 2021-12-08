import { PrismaClient } from '@prisma/client'

// create single instance of prisma for development: https://github.com/prisma/prisma/issues/1983
declare global {
  var prisma: PrismaClient
}

if (process.env.NODE_ENV === 'production') {
  global.prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
}

export default global.prisma
