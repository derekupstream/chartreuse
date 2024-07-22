import { getProjections } from 'lib/calculator/getProjections';
import prisma from 'lib/prisma';
import { getSharedProjections } from 'lib/share/getSharedProjections';

async function query() {
  // const r = await getProjections('a3bba2e5-3881-4f29-8de4-c7c45be3f1f9');
  // console.log(r);
  // const result = await getSharedProjections('pepsi');
  // console.log(result.projects.map(p => p?.project));
  await prisma.project.update({
    where: {
      id: 'c6a8a8fa-ca6f-4bb6-a0f7-a978676c0201'
    },
    data: {
      templateDescription: '- 150 customers a day\n- Using dishwasher\n- Mostly take-out'
    }
  });
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
