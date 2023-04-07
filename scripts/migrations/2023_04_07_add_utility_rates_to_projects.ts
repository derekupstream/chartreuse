
import prisma from 'lib/prisma';

async function init () {

  const accounts = await prisma.account.findMany();

  console.log('found', accounts.length, 'accounts');

  for (const account of accounts) {
    console.log('updating account', account.id, account.USState);
    await prisma.project.updateMany({
      where: {
        accountId: account.id
      },
      data: {
        USState: account.USState,
      }
    });
  }

}

init();