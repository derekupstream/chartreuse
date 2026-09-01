/**
 * Dev-only tripwire for the stale-server trap.
 *
 * The dev server caches its PrismaClient in a global for its whole lifetime (necessary —
 * recreating it on every hot reload exhausts database connections). The cost: after a
 * schema change + `prisma generate`, the RUNNING server still speaks the OLD schema, and
 * every query touching a new column fails with a confusing "column does not exist".
 *
 * This guard hashes prisma/schema.prisma when the server first handles a request (stored
 * on globalThis, same lifetime as the cached client) and re-checks it cheaply afterwards.
 * The moment the file differs, every API request gets a 503 that says exactly what
 * happened and exactly how to fix it — the mystery error becomes an instruction.
 *
 * Production is untouched: deploys always boot fresh, so the guard is dev-only by design.
 */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';

export const STALE_SERVER_MESSAGE =
  'Dev server is stale: prisma/schema.prisma changed after this server started, so its cached ' +
  'Prisma client does not know the new schema. Restart it: kill $(lsof -ti tcp:3000) && rm -rf .next && yarn dev';

function hashSchema(): string | null {
  try {
    return createHash('sha1')
      .update(readFileSync(path.join(process.cwd(), 'prisma/schema.prisma')))
      .digest('hex');
  } catch {
    return null;
  }
}

// Same globalThis pattern as lib/prisma.ts: survives hot reloads, dies with the process —
// exactly the lifetime of the cached PrismaClient it guards.
const g = globalThis as unknown as { __schemaBootHash?: string | null; __schemaCheck?: { at: number; stale: boolean } };
if (process.env.NODE_ENV === 'development' && g.__schemaBootHash === undefined) {
  g.__schemaBootHash = hashSchema();
}

/** True when the schema file no longer matches what this server booted with. Re-checks at most every 3s. */
export function schemaIsStale(): boolean {
  if (process.env.NODE_ENV !== 'development' || !g.__schemaBootHash) return false;
  const now = Date.now();
  if (!g.__schemaCheck || now - g.__schemaCheck.at > 3000) {
    g.__schemaCheck = { at: now, stale: hashSchema() !== g.__schemaBootHash };
  }
  return g.__schemaCheck.stale;
}
