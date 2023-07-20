const EMAIL_BLACKLIST = ['ecodaisyusa@gmail.com', 'priskainc@yahoo.com', 'priscilla@upstreamsolutions.org'];

export function isBlacklistedEmail(email: string) {
  return EMAIL_BLACKLIST.includes(email);
}

export function assertEmailIsNotBlacklisted(email: string) {
  if (isBlacklistedEmail(email)) {
    throw new Error('There was a problem with your account. Please contact Upstream support');
  }
}
