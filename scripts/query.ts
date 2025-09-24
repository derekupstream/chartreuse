import { Role } from '@prisma/client';
import { getProjections } from 'lib/calculator/getProjections';
import prisma from 'lib/prisma';
import { getSharedProjections } from 'lib/share/getSharedProjections';

async function query() {
  // console.log(
  //   await prisma.org.findFirst({
  //     where: {
  //       id: '3f42a5c7-0fdd-436a-983b-6067a3804ef4'
  //     },
  //     include: {
  //       users: true
  //     }
  //   })
  // );
  // console.log(
  //   await prisma.user.findFirst({
  //     where: {
  //       email: 'mattwad@gmail.com'
  //     }
  //   })
  // );
  console.log(
    await prisma.user.findFirst({
      where: {
        email: 'sustainableeventservices@lanecountyor.gov'
      }
    })
  );

  await prisma.user.update({
    where: {
      id: 'SILzOMscCqMvL29TfuTKgU8BhW22'
    },
    data: {
      role: 'ORG_ADMIN'
    }
  });
  // const user = await prisma.user.create({
  //   data: {
  //     id: 'SILzOMscCqMvL29TfuTKgU8BhW22',
  //     name: 'Event Services',
  //     email: 'sustainableeventservices@lanecountyor.gov',
  //     role: Role.ACCOUNT_ADMIN,
  //     org: {
  //       connect: {
  //         id: '3f42a5c7-0fdd-436a-983b-6067a3804ef4'
  //       }
  //     }
  //   },
  //   include: {
  //     org: true
  //   }
  // });
  // console.log(user);
  // await prisma.invite.update({
  //   where: {
  //     id: '429e8ee2-5261-4b48-91db-3eb7ce56d4ab'
  //   },
  //   data: {
  //     accepted: true
  //   }
  // });
}

query().catch(err => {
  console.error('error', err);
  process.exit(1);
});
