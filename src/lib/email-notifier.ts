import { env } from '../config/env';

interface ErrorEntry {
  userId: number | null;
  userName: string;
  level?: string;
  message: string;
  stack?: string | null;
  context?: any;
  ipAddress?: string;
  url?: string;
}

export async function sendErrorAlert(entry: ErrorEntry): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, DEV_EMAIL } = env as any;
  if (!SMTP_HOST || !DEV_EMAIL) return;

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });

    await transporter.sendMail({
      from: SMTP_USER || `noreply@${SMTP_HOST}`,
      to: DEV_EMAIL,
      subject: `[NexusEdu ${env.NODE_ENV}] ${entry.level?.toUpperCase()}: ${entry.message.slice(0, 100)}`,
      html: `
        <h2>NexusEdu System Alert</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Level</td><td style="padding:8px;border:1px solid #ddd">${entry.level || 'error'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${entry.message}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">User</td><td style="padding:8px;border:1px solid #ddd">${entry.userName} (ID: ${entry.userId || 'N/A'})</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">IP</td><td style="padding:8px;border:1px solid #ddd">${entry.ipAddress || 'unknown'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">URL</td><td style="padding:8px;border:1px solid #ddd">${entry.url || 'N/A'}</td></tr>
        </table>
        ${entry.stack ? `<h3>Stack Trace</h3><pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow:auto;font-size:12px">${entry.stack}</pre>` : ''}
        ${entry.context ? `<h3>Context</h3><pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow:auto;font-size:12px">${JSON.stringify(entry.context, null, 2)}</pre>` : ''}
        <hr>
        <p style="color:#888;font-size:12px">Sent from NexusEdu School Management System</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send error alert email (SMTP may not be configured):', (err as Error).message);
  }
}
