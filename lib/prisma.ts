import { PrismaClient } from '@prisma/client';

declare global {
  //var prisma: PrismaClient - dont add this or we may forget to import prisma in a file
}

// Supabase pooler connections require pgbouncer=true (disables prepared statements)
// and sslmode=require. Local dev also uses pgbouncer=true to prevent stale prepared
// statements across Next.js hot-reloads.
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || '';
  const sep = url.includes('?') ? '&' : '?';
  const parts: string[] = [];
  if (!url.includes('pgbouncer')) parts.push('pgbouncer=true');
  if (url.includes('supabase.co') && !url.includes('sslmode')) parts.push('sslmode=require');
  return parts.length ? url + sep + parts.join('&') : url;
}

// @ts-expect-error - global.prisma is not defined
let prisma: PrismaClient = global.prisma;

// create single instance of prisma for development: https://github.com/prisma/prisma/issues/1983
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ datasources: { db: { url: getDatabaseUrl() } } });
} else {
  if (!prisma) {
    // @ts-expect-error - global.prisma is not defined
    prisma = global.prisma = new PrismaClient({ datasources: { db: { url: getDatabaseUrl() } } });
  }
}

export default prisma;
