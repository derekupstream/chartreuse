import md5 from 'md5';

import prisma from 'lib/prisma';

import { mailchimp } from './client';
import { listId } from './client';

export const MAILCHIMP_EVENTS = ['signed_up', 'completed_single_use_step', 'completed_purchasing_updates'] as const;

export type MailChimpEvent = (typeof MAILCHIMP_EVENTS)[number];

export async function sendEventOnce(event: MailChimpEvent, { email, userId }: { email: string; userId: string }) {
  if (!MAILCHIMP_EVENTS.includes(event)) {
    throw new Error('Invalid event: ' + event);
  }
  const dbEvent = await prisma.userEvent.findFirst({
    where: {
      userId,
      type: event
    }
  });
  if (!dbEvent) {
    await prisma.userEvent.create({
      data: {
        userId,
        type: event
      }
    });
    await sendEvent(event, { email });
    console.log('Saved and sent event to Mailchimp: ' + event, { userId });
  }
}

export async function sendEvent(event: MailChimpEvent, { email }: { email: string }) {
  const subscriberHash = md5(email.toLowerCase());
  return (
    mailchimp.lists
      // @ts-ignore - TS doesn't know about the createListMemberEvent method
      .createListMemberEvent(listId, subscriberHash, {
        name: event
        // properties: {
        //   projectTitle
        // }
      })
      .catch((error: any) => {
        if (error.status === 404) {
          console.warn('Received error from Mailchimp (404): email not found');
        } else {
          console.error(`Received error from Mailchimp (${error.status}): ${error.text}`);
        }
      })
  );
}
