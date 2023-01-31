import prisma from 'lib/prisma';

async function query() {
  await prisma.singleUseLineItemRecord.deleteMany({});
}

query();
