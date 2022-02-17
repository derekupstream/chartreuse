import prisma from '../lib/prisma';
import mailgun from '../lib/mailgun'

export { }

const orgId = '79cb54a3-8b75-4841-93d4-a23fd1c07553';
const email = 'mattwad+upstream@gmail.com';
const inviterEmail = 'matt@upstreamsolutions.org';
const webHost = 'https://app.chartreuse.eco';

(async () => {

  try {
    const org = await prisma.org.findFirst({
      where: { id: orgId }
    })
    const inviter = await prisma.user.findFirst({
      where: { email: inviterEmail }
    })
    if (!org) {
      throw new Error('No org found: ' + orgId)
    }
    if (!inviter) {
      throw new Error('No user found by email: ' + inviter)
    }

    const invite = await prisma.invite.create({
      data: {
        email,
        sentBy: {
          connect: {
            id: inviter.id,
          },
        },
        // account: accountId
        //   ? {
        //     connect: {
        //       id: accountId,
        //     },
        //   }
        //   : undefined,
        org: {
          connect: {
            id: orgId,
          },
        },
      },
      include: {
        org: true,
      },
    })

    await mailgun.messages().send({
      from: 'Chartreuse <hello@chartreuse.eco>',
      to: email,
      subject: `Invite from ${inviter.name} to join Chart Reuse`,
      template: 'invite',
      'v:inviterName': inviter.name,
      'v:inviterJobTitle': inviter.title,
      'v:inviterOrg': invite.org.name,
      'v:inviteUrl': `${webHost}/accept?inviteId=${invite.id}`,
    })

    process.exit(0)
  }
  catch (error) {
    console.error(error)
    process.exit(1)
  }

})();