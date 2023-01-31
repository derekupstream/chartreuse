import { PrismaClient } from '@prisma/client';

declare global {
  //var prisma: PrismaClient - dont add this or we may forget to import prisma in a file
}

// @ts-expect-error - global.prisma is not defined
let prisma: PrismaClient = global.prisma;

// create single instance of prisma for development: https://github.com/prisma/prisma/issues/1983
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!prisma) {
    // @ts-expect-error - global.prisma is not defined
    prisma = global.prisma = new PrismaClient();
  }
}

export default prisma;
