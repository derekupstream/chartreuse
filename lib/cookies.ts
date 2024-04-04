import { destroyCookie, parseCookies, setCookie } from 'nookies';

import type { ProjectProjection } from 'lib/share/getSharedProjections';

// the template someone selects from a shared page
export const selectedTemplateCookie = 'selectedTemplate';

export function setSelectedTemplateCookie(template: ProjectProjection['templateParams']) {
  setCookie(null, selectedTemplateCookie, JSON.stringify(template), { maxAge: 60 * 60 * 24 * 7 });
}

export function readSelectedTemplateCookie(): ProjectProjection['templateParams'] | undefined {
  return readCookie(selectedTemplateCookie);
}

export function readCookie(cookieName: string) {
  const cookies = parseCookies(null);
  if (typeof cookies[cookieName] === 'string') {
    try {
      return JSON.parse(cookies[cookieName]);
    } catch (error: any) {}
  }
  return cookies[cookieName];
}

export function deleteCookie(cookieName: string) {
  destroyCookie(null, cookieName);
}
