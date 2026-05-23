import juice from 'juice';

const SHELL_OPEN = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title></title></head>
<body style="margin:0;padding:0;background:#f4f3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#222;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f3f0;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:24px 32px 12px;border-bottom:1px solid #eee;">
        <span style="font-weight:700;font-size:18px;color:#2bbe50;">Chart-Reuse</span>
      </td></tr>
      <tr><td style="padding:32px;font-size:15px;line-height:1.55;">`;

const SHELL_CLOSE = `      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
        Chart-Reuse by Upstream Solutions
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

/**
 * Wrap user-edited HTML in a bulletproof email shell (centered, 600px max-width,
 * Chart-Reuse header/footer) and inline all CSS for Outlook compatibility.
 */
export function wrapEmailHtml(body: string): string {
  const full = SHELL_OPEN + body + SHELL_CLOSE;
  return juice(full);
}
