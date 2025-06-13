import { getProjections } from 'lib/calculator/getProjections';
import prisma from 'lib/prisma';
import { getSharedProjections } from 'lib/share/getSharedProjections';

async function query() {
  console.log(
    await prisma.org.findFirst({
      where: {
        name: {
          contains: 'Eugene'
        }
      },
      include: {
        users: true
      }
    })
  );
}

query().catch(err => {
  console.error('error', err);
  process.exit(1);
});
