import prisma from 'lib/prisma';

async function query() {
  const org = await prisma.org.findFirst({
    where: {
      name: 'Staging'
    },
    include: {
      users: true
    }
  })
  console.log(org)
}

query();
