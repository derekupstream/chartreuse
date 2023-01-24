import { sendEvent } from '../lib/mailchimp/sendEvent';

const email = 'mattwad+upstream@gmail.com'

async function init() {
  console.log(await sendEvent('completed_first_project', { email }));
}

init();