import { getProjections } from 'lib/calculator/getProjections';
import prisma from 'lib/prisma';
import { getSharedProjections } from 'lib/share/getSharedProjections';

async function query() {
  const r = await getProjections('64bdd945-98dd-4699-a8c4-9924520e9430');
  console.log(JSON.stringify(r, null, 2));

  // const project = await prisma.project.findFirst({
  //   where: {
  //     id: 'e370a2a1-7997-457a-95e5-8c8b2fa4e91f'
  //   },
  //   include: {
  //     org: {
  //       include: {
  //         users: true
  //       }
  //     }
  //   }
  // });
  // console.log(JSON.stringify(project, null, 2));

  // const result = await getSharedProjections('pepsi');
  // console.log(result.projects.map(p => p?.project));
  // const project = await prisma.project.findFirst({
  //   where: {
  //     id: '64bdd945-98dd-4699-a8c4-9924520e9430'
  //   },
  //   include: {
  //     org: {
  //       include: {
  //         users: true
  //       }
  //     }
  //   }
  // });
  // console.log(JSON.stringify(project, null, 2));
  // const org = await prisma.project.groupBy({
  //   where: {
  //     templateId: {
  //       not: null
  //     }
  //   },
  //   by: ['orgId'],
  //   _count: true
  // });
  // console.log(org);
}

query();
