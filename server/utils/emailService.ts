import nodemailer from 'nodemailer';

function getTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });
}

const fromAddress = () =>
  `"RoomVibe" <${process.env.SMTP_USER || 'no-reply@roomvibe.app'}>`;

export async function sendInboxNotificationEmail(
  recipientEmail: string,
  senderName: string
): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('[email] SMTP not configured — inbox notification skipped');
    return;
  }

  const appUrl = process.env.APP_URL || 'https://app.roomvibe.app';
  const inboxUrl = `${appUrl}/#/dashboard`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9f9f7;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#1E2A3B;padding:28px 40px;text-align:center;">
              <span style="color:#C9A24A;font-size:22px;font-weight:700;letter-spacing:0.5px;">RoomVibe</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1E2A3B;">New Message</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#1E2A3B;">${escapeHtml(senderName)}</strong> has sent you a message through your RoomVibe public profile.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6;">
                Open your inbox to read and reply.
              </p>
              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#1E2A3B;">
                    <a href="${inboxUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Open Inbox
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f0ede8;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                You are receiving this email because inbox notifications are enabled for your RoomVibe account.
                You can turn this off in your Dashboard → Settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `New message on RoomVibe\n\n${senderName} has sent you a message through your public profile.\n\nOpen your inbox to read and reply:\n${inboxUrl}\n\n---\nTo stop receiving these notifications, go to Dashboard → Settings.`;

  await transporter.sendMail({
    from: fromAddress(),
    to: recipientEmail,
    subject: 'New message on RoomVibe',
    text,
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
