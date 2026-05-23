import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Seed = {
  eventKey: string;
  displayName: string;
  description: string;
  subjectLine: string;
  htmlContent: string;
  variables: string[];
  recipientHint: string;
};

const events: Seed[] = [
  {
    eventKey: 'member-invite',
    displayName: 'Member invitation',
    description: 'Sent when an admin invites someone to their organization from /members.',
    subjectLine: 'Invite from {{inviterName}} to join Chart-Reuse',
    variables: ['inviterName', 'inviterJobTitle', 'inviterOrg', 'inviteUrl'],
    recipientHint: 'Invited person',
    htmlContent: `<p>Hi,</p>
<p><strong>{{inviterName}}</strong>{{#if inviterJobTitle}} ({{inviterJobTitle}}){{/if}} invited you to join <strong>{{inviterOrg}}</strong> on Chart-Reuse.</p>
<p><a href="{{inviteUrl}}" style="display:inline-block;padding:12px 24px;background:#2bbe50;color:#fff;text-decoration:none;border-radius:4px;font-weight:500;">Accept invitation</a></p>
<p style="color:#666;font-size:13px;">If the button doesn't work, paste this link into your browser:<br/>{{inviteUrl}}</p>`
  },
  {
    eventKey: 'join-request-received',
    displayName: 'New join request received',
    description: 'Sent to org admins when someone requests to join their organization through the signup flow.',
    subjectLine: '{{requesterName}} requested to join {{orgName}} on Chart-Reuse',
    variables: ['requesterName', 'requesterEmail', 'requesterMessage', 'orgName', 'membersUrl'],
    recipientHint: 'All ORG_ADMIN users of the target org',
    htmlContent: `<p>Hi,</p>
<p><strong>{{requesterName}}</strong> ({{requesterEmail}}) has requested to join your organization <strong>{{orgName}}</strong> on Chart-Reuse.</p>
{{#if requesterMessage}}<blockquote style="border-left:3px solid #ddd;padding-left:12px;color:#555;margin:16px 0;">{{requesterMessage}}</blockquote>{{/if}}
<p><a href="{{membersUrl}}" style="display:inline-block;padding:12px 24px;background:#2bbe50;color:#fff;text-decoration:none;border-radius:4px;font-weight:500;">Review on Members page</a></p>`
  },
  {
    eventKey: 'join-request-approved',
    displayName: 'Join request approved',
    description: 'Sent to the requester when an admin approves their join request.',
    subjectLine: "You've been approved to join {{orgName}} on Chart-Reuse",
    variables: ['requesterName', 'orgName', 'loginUrl'],
    recipientHint: 'The original requester',
    htmlContent: `<p>Hi {{requesterName}},</p>
<p>Good news — your request to join <strong>{{orgName}}</strong> on Chart-Reuse was approved. You can sign in now and start using the platform.</p>
<p><a href="{{loginUrl}}" style="display:inline-block;padding:12px 24px;background:#2bbe50;color:#fff;text-decoration:none;border-radius:4px;font-weight:500;">Sign in to Chart-Reuse</a></p>`
  },
  {
    eventKey: 'join-request-declined',
    displayName: 'Join request declined',
    description: 'Sent to the requester when an admin declines their join request.',
    subjectLine: 'Your request to join {{orgName}} on Chart-Reuse',
    variables: ['requesterName', 'orgName'],
    recipientHint: 'The original requester',
    htmlContent: `<p>Hi {{requesterName}},</p>
<p>Thanks for your interest in joining <strong>{{orgName}}</strong>. The admins decided not to approve your request at this time.</p>
<p>If you believe this was a mistake, reach out to your team directly.</p>`
  }
];

async function main() {
  for (const ev of events) {
    await prisma.emailEvent.upsert({
      where: { eventKey: ev.eventKey },
      create: ev,
      update: {
        displayName: ev.displayName,
        description: ev.description,
        recipientHint: ev.recipientHint,
        variables: ev.variables
      }
    });
    console.log(`Seeded ${ev.eventKey}`);
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
