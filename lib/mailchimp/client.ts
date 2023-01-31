import mailchimp from '@mailchimp/mailchimp_marketing';

// Resources: https://mailchimp.com/developer/marketing/guides/track-outside-activity-events/

const apiKey = typeof process.env.MAILCHIMP_API_KEY === 'string' ? process.env.MAILCHIMP_API_KEY : '';
const serverPrefix = typeof process.env.MAILCHIMP_SERVER_PREFIX === 'string' ? process.env.MAILCHIMP_SERVER_PREFIX : '';
export const listId = typeof process.env.MAILCHIMP_LIST_ID === 'string' ? process.env.MAILCHIMP_LIST_ID : '';

mailchimp.setConfig({
  apiKey: apiKey,
  server: serverPrefix
});

export { mailchimp };
