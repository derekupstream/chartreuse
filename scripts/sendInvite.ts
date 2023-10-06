import { sendEmail } from '../lib/mailgun';
import prisma from '../lib/prisma';

export {};

const orgId = 'a2c6a7d5-d6aa-4172-8d7f-a775a5ba18b4';
const email = 'mattwad+upstream2@gmail.com';
const inviterEmail = 'samantha@upstreamsolutions.org';
const webHost = 'https://app.chart-reuse.eco';

(async () => {
  try {
    const org = await prisma.org.findFirst({
      where: { id: orgId }
    });
    const inviter = await prisma.user.findFirst({
      where: { email: inviterEmail }
    });
    if (!org) {
      throw new Error('No org found: ' + orgId);
    }
    if (!inviter) {
      throw new Error('No user found by email: ' + inviter);
    }

    const invite = await prisma.invite.create({
      data: {
        email,
        sentBy: {
          connect: {
            id: inviter.id
          }
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
            id: orgId
          }
        }
      },
      include: {
        org: true
      }
    });

    await sendEmail({
      from: 'Chart-Reuse <hello@chart-reuse.eco>',
      to: email,
      subject: `Invite from ${inviter.name} to join Chart-Reuse`,
      template: 'invite',
      'v:inviterName': inviter.name,
      'v:inviterJobTitle': inviter.title,
      'v:inviterOrg': invite.org.name,
      'v:inviteUrl': `${webHost}/accept?inviteId=${invite.id}`
    });

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
