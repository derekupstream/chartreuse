import prisma from 'lib/prisma';

import type { MixpanelProfile } from './analytics/mixpanel.node';
import { sendEvent, identify } from './analytics/mixpanel.node';
import { sendEmail } from './mailgun';

const WEB_HOST = process.env.NODE_ENV === 'production' ? 'https://app.chart-reuse.eco' : 'http://localhost:3000';

const IDENTITY_EVENTS: UserEventType[] = ['signup', 'join_org'];

type EventBase = {
  // props get passed to Mixpanel as metadata
  props?: any;
};

type UserSignupEvent = EventBase & {
  type: 'signup';
};
type JoinOrgEvent = EventBase & {
  type: 'join_org';
};
type CreateAccountEvent = EventBase & {
  type: 'create_account';
  props: {
    accountName: string;
  };
};
type CreateProjectEvent = EventBase & {
  type: 'create_project';
  props: {
    projectName: string;
  };
};

type UserEvent = UserSignupEvent | JoinOrgEvent | CreateAccountEvent | CreateProjectEvent;

export type UserEventType = UserEvent['type'];

type Template = {
  subject: string;
  body: (context: TemplateBaseContext, event?: any) => string;
};

type TemplateBaseContext = {
  userEmail: string;
  orgName: string;
};

const TEMPLATES: Record<UserEventType, Template> = {
  signup: {
    subject: 'A new user signed up',
    body: context => `
    <p>
      ${context.userEmail} created the ${context.orgName} organization.
    </p>
    `
  },
  join_org: {
    subject: ' user joined an organization',
    body: event => `
    <p>
      ${event.userEmail} accepted an invite and joined the ${event.orgName} organization.
    </p>
    `
  },
  create_account: {
    subject: 'An account was created',
    body: (context, event: CreateAccountEvent) => `
      <p>
        A new account "${event.props.accountName}" was created by ${context.userEmail} for the ${context.orgName} organization.
      </p>
    `
  },
  create_project: {
    subject: 'A project was created',
    body: (context, event: CreateProjectEvent) => `
      <p>
        A new project "${event.props.projectName}" was created by ${context.userEmail} for the ${context.orgName} organization.
      </p>
    `
  }
};

export async function trackEvent(event: UserEvent & { userId: string }) {
  const template = TEMPLATES[event.type];
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: event.userId },
      include: { org: true }
    });
    if (process.env.NOTIFICATIONS_EMAIL) {
      await sendEmail({
        from: 'Chart-Reuse <noreply@chart-reuse.eco>',
        to: process.env.NOTIFICATIONS_EMAIL,
        subject: `New Event: ${template.subject}`,
        html: `${template.body(
          { userEmail: user?.email, orgName: user.org.name },
          event
        )}<br /><p>Sent from <a href="${WEB_HOST}">app.chart-reuse.eco</a></p>`
      });
      console.log(`Sent user event email for event to ${process.env.NOTIFICATIONS_EMAIL}: ` + event.type);
    }

    if (IDENTITY_EVENTS.includes(event.type)) {
      const profile: MixpanelProfile = {
        $created: user.createdAt.toISOString(),
        $name: user.name ?? '',
        Organization: user.org.name
      };
      identify(user.id, profile);
    }

    await sendEvent(event.type, { userId: event.userId, Organization: user.org.name, ...event.props });
  } catch (error) {
    console.error(`Error sending user event "${event.type}"`, error);
  }
}
