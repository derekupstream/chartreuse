import { sendEmail } from './mailgun'

const WEB_HOST = process.env.NODE_ENV === 'production' ? 'https://app.chartreuse.eco' : 'http://localhost:3000'

type create_user = 'signup' | 'join_org'

type EventType = create_user | 'create_account' | 'create_project'

type EventBase = {
  orgName: string
  userEmail: string
}

type UserSignupEvent = EventBase & {
  type: 'signup'
}
type JoinOrgEvent = EventBase & {
  type: 'join_org'
}
type CreateAccountEvent = EventBase & {
  type: 'create_account'
  accountName: string
}
type CreateProjectEvent = EventBase & {
  type: 'create_project'
  projectName: string
}

type UserEvent = UserSignupEvent | JoinOrgEvent | CreateAccountEvent | CreateProjectEvent

type Template = {
  subject: string
  body: (event: any) => string
}

const TEMPLATES: Record<EventType, Template> = {
  signup: {
    subject: 'A new user signed up',
    body: (event: UserSignupEvent) => `
    <p>
      ${event.userEmail} created the ${event.orgName} organization.
    </p>
    `,
  },
  join_org: {
    subject: ' user joined an organization',
    body: (event: JoinOrgEvent) => `
    <p>
      ${event.userEmail} accepted an invite and joined the ${event.orgName} organization.
    </p>
    `,
  },
  create_account: {
    subject: 'An account was created',
    body: (event: CreateAccountEvent) => `
      <p>
        A new account "${event.accountName}" was created by ${event.userEmail} for the ${event.orgName} organization.
      </p>
    `,
  },
  create_project: {
    subject: 'A project was created',
    body: (event: CreateProjectEvent) => `
      <p>
        A new project "${event.projectName}" was created by ${event.userEmail} for the ${event.orgName} organization.
      </p>
    `,
  },
}

function getUrl(path: string) {
  return `${WEB_HOST}${path}`
}

export async function trackEvent(event: UserEvent) {
  const template = TEMPLATES[event.type]

  if (process.env.NOTIFICATIONS_EMAIL) {
    try {
      await sendEmail({
        from: 'Chart Reuse Events<bot@chartreuse.eco>',
        to: process.env.NOTIFICATIONS_EMAIL,
        subject: `New Event: ${template.subject}`,
        html: `${template.body(event)}<br /><p>Sent from <a href="${WEB_HOST}">app.chartreuse.eco</a></p>`,
      })
    } catch (error) {
      console.error('Error sending user event:', error)
    }
    console.log('Sent user event email for event: ' + event.type)
  } else {
    console.log('User event: ' + event.type)
  }
}
