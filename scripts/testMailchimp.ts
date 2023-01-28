import { sendEvent, MAILCHIMP_EVENTS } from '../lib/mailchimp/sendEvent';

const email = 'mattwad+upstream@gmail.com'

async function init() {
  console.log(await sendEvent(MAILCHIMP_EVENTS[0], { email }));
}

init();