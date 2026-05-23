import prisma from 'lib/prisma';

import { sendEmail } from '../mailgun';
import { wrapEmailHtml } from './wrapHtml';

export type SendEventOptions = {
  to: string | string[];
  vars?: Record<string, string | undefined | null>;
  fromOverride?: string;
};

const DEFAULT_FROM = 'Chart-Reuse <hello@chart-reuse.eco>';

/**
 * Substitute {{varName}} and basic {{#if varName}}...{{/if}} blocks in a template.
 * Blocks are removed entirely if the variable is missing/empty.
 */
function render(template: string, vars: Record<string, string | undefined | null>): string {
  const ifBlock = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  let out = template.replace(ifBlock, (_, key, inner) => {
    const v = vars[key];
    return v ? inner : '';
  });
  const varToken = /\{\{(\w+)\}\}/g;
  out = out.replace(varToken, (_, key) => {
    const v = vars[key];
    return v == null ? '' : String(v);
  });
  return out;
}

/**
 * Look up the EmailEvent by key, render templates, wrap in the email shell,
 * and dispatch via Mailgun. Silently no-ops if the event is disabled or absent.
 * Errors are caught — caller never has to wrap in try/catch.
 */
export async function sendEvent(eventKey: string, opts: SendEventOptions): Promise<void> {
  try {
    const ev = await prisma.emailEvent.findUnique({ where: { eventKey } });
    if (!ev) {
      console.warn(`sendEvent: no EmailEvent row for key='${eventKey}' — skipping`);
      return;
    }
    if (!ev.enabled) {
      console.log(`sendEvent: event '${eventKey}' is disabled — skipping`);
      return;
    }

    const vars = opts.vars || {};
    const subject = render(ev.subjectLine, vars);
    const html = wrapEmailHtml(render(ev.htmlContent, vars));
    const text = ev.textContent ? render(ev.textContent, vars) : undefined;

    const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
    for (const to of recipients) {
      if (!to) continue;
      try {
        await sendEmail({
          from: opts.fromOverride || DEFAULT_FROM,
          to,
          subject,
          html,
          ...(text ? { text } : {})
        });
      } catch (err) {
        console.error(`sendEvent: Mailgun send failed for '${eventKey}' to ${to}`, err);
      }
    }
  } catch (err) {
    console.error(`sendEvent: unexpected error for '${eventKey}'`, err);
  }
}
