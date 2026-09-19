/**
 * Cut a collection release from the command line — same machinery as the Databases page's
 * "Update version to …" (lib/admin/dataReleases.cutRelease): stamps every database with the
 * version and stores the whole collection for exact restore.
 *
 *   npx dotenv-cli -e .env -- npx tsx scripts/cut-release.ts v2.1 "What changed" [actor-user-id]
 *
 * The actor is a User.id (UUID — changelog rows require it), not an email:
 *   psql: select id from "User" where email = '...';
 */
import { cutRelease } from 'lib/admin/dataReleases';
import prisma from 'lib/prisma';

async function main() {
  const [name, note, actor] = process.argv.slice(2);
  if (!name) {
    console.error('Usage: npx tsx scripts/cut-release.ts <version e.g. v2.1> "<note>" [actor User.id (UUID)]');
    process.exit(1);
  }
  const release = await cutRelease(name, note ?? null, actor ?? null);
  console.log(`Cut ${release.name} — ${release.databases} databases stored and stamped.`);
}

main()
  .catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
