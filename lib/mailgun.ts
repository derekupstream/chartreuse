import mailgunFactory from 'mailgun-js'

const mailgun = mailgunFactory({
  apiKey: process.env.MAILGUN_API_KEY || '',
  domain: process.env.MAILGUN_DOMAIN || '',
})

export default mailgun
