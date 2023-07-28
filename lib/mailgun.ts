import formData from 'form-data';
import Mailgun from 'mailgun.js';

const API_KEY = process.env.MAILGUN_API_KEY as string;
const DOMAIN = process.env.MAILGUN_DOMAIN as string;

const mailgun = new Mailgun(formData);

type MailgunClient = ReturnType<typeof mailgun.client>;

type MailgunMessageData = Parameters<MailgunClient['messages']['create']>[1];

export function sendEmail(data: MailgunMessageData) {
  const client = mailgun.client({ username: 'api', key: API_KEY });
  return client.messages.create(DOMAIN, data);
}
