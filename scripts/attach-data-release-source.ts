/**
 * Attaches the Data Release source workbook (Madhavi's Directory file) as the stored,
 * downloadable source for every database loaded from it — clicking "source" in the
 * Databases UI then serves the actual file.
 *
 * Run:  npx dotenv-cli -e .env -- npx tsx scripts/attach-data-release-source.ts [path-to-xlsx]
 * Idempotent: reuses the stored file if one with the same name+size already exists.
 */
import { readFileSync } from 'fs';
import path from 'path';
import os from 'os';

import prisma from '../lib/prisma';

const DEFAULT_PATH = path.join(os.homedir(), 'Downloads', 'Upstream Copy-Chart-Reuse Directory.xlsx');
const RELEASE_DATABASES = [
  'Single-Use Products',
  'Reusable Products',
  'GHG Factors',
  'Water Factors',
  'Transport Factors',
  'Purchase Frequency',
  'Utility Rates',
  'Dishwasher Factors',
  'Data Dictionary',
  'Validation',
  'Open Questions',
  'Funding Opportunities'
];

async function main() {
  const filePath = process.argv[2] ?? DEFAULT_PATH;
  const bytes = readFileSync(filePath);
  const fileName = path.basename(filePath);

  let file = await prisma.dataSourceFile.findFirst({ where: { fileName, sizeBytes: bytes.length } });
  if (!file) {
    file = await prisma.dataSourceFile.create({
      data: {
        fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sizeBytes: bytes.length,
        bytes
      }
    });
    console.log(`stored "${fileName}" (${(bytes.length / 1024).toFixed(0)} KB) as ${file.id}`);
  } else {
    console.log(`reusing stored "${fileName}" (${file.id})`);
  }

  const result = await prisma.factorDatabase.updateMany({
    where: { name: { in: RELEASE_DATABASES } },
    data: { sourceFileId: file.id }
  });
  console.log(`linked ${result.count} databases to the source file`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
