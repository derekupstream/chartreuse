import formData from 'form-data';
import Mailgun from 'mailgun.js';

const API_KEY = process.env.MAILGUN_API_KEY as string;
const DOMAIN = process.env.MAILGUN_DOMAIN as string;

const mailgun = new Mailgun(formData);
const client = mailgun.client({ username: 'api', key: API_KEY });

export default client;

type MailgunMessageData = Parameters<typeof client.messages.create>[1];

export function sendEmail(data: MailgunMessageData) {
  return client.messages.create(DOMAIN, data);
}
