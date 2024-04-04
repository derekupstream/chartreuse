import { getProjections } from 'lib/calculator/getProjections';
import prisma from 'lib/prisma';
import { getSharedProjections } from 'lib/share/getSharedProjections';

async function query() {
  // const r = await getProjections('a3bba2e5-3881-4f29-8de4-c7c45be3f1f9');
  // console.log(r);
  const result = await getSharedProjections('pepsi');
  // console.log(result.projects.map(p => p?.project));

  // const org = await prisma.org.findFirst({
  //   where: {
  //     name: 'Staging'
  //   },
  //   include: {
  //     users: true
  //   }
  // });
  // console.log(org);
}

query();
