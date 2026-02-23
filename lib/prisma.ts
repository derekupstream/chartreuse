import { PrismaClient } from '@prisma/client';

declare global {
  //var prisma: PrismaClient - dont add this or we may forget to import prisma in a file
}

// Supabase direct connections require SSL. Append sslmode=require if not already present.
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || '';
  if (url.includes('supabase.co') && !url.includes('sslmode') && !url.includes('pgbouncer')) {
    return url + (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  return url;
}

// @ts-expect-error - global.prisma is not defined
let prisma: PrismaClient = global.prisma;

// create single instance of prisma for development: https://github.com/prisma/prisma/issues/1983
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ datasources: { db: { url: getDatabaseUrl() } } });
} else {
  if (!prisma) {
    // @ts-expect-error - global.prisma is not defined
    prisma = global.prisma = new PrismaClient();
  }
}

export default prisma;
