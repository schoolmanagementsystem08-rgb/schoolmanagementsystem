import { db } from '../db';
import { activityLogs, errorLogs } from '../db/schema';
import { sendErrorAlert } from './email-notifier';

function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function extractUser(req: any): { id: string | null; name: string; role: string } {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    try {
      const parts = authHeader.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return {
          id: payload.sub || null,
          name: payload.name || payload.email || 'unknown',
          role: payload.role || 'unknown',
        };
      }
    } catch {}
  }
  return { id: null, name: 'system', role: 'system' };
}

export async function logActivity(params: {
  action: string;
  entity?: string;
  entityId?: number;
  details?: any;
  req?: any;
  userId?: string | number;
  userName?: string;
  userRole?: string;
  path?: string;
  method?: string;
}) {
  try {
    let ip = 'unknown';
    let ua: string | undefined;
    let path = params.path;
    let method = params.method;
    let user: { id: string | number | null; name: string; role: string } = { id: params.userId ?? null, name: params.userName || 'unknown', role: params.userRole || 'unknown' };

    if (params.req) {
      ip = getClientIp(params.req);
      ua = params.req.headers['user-agent'];
      if (!path) path = params.req.originalUrl || params.req.url;
      if (!method) method = params.req.method;
      const extracted = extractUser(params.req);
      if (!params.userId) user = extracted;
    }

    await db.insert(activityLogs).values({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: params.action,
      entity: params.entity || null,
      entityId: params.entityId || null,
      details: params.details ? JSON.stringify(params.details) : null,
      ipAddress: ip,
      userAgent: ua || null,
      path: path || null,
      method: method || null,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export async function logError(params: {
  message: string;
  level?: string;
  stack?: string;
  context?: any;
  req?: any;
  userId?: string | number;
  userName?: string;
}) {
  const entry = {
    userId: params.userId ?? null,
    userName: params.userName || 'unknown',
    level: params.level || 'error',
    message: params.message,
    stack: params.stack || null,
    context: params.context ? JSON.stringify(params.context) : null,
    ipAddress: 'unknown',
    url: 'unknown',
  };

  if (params.req) {
    entry.ipAddress = getClientIp(params.req);
    entry.url = params.req.originalUrl || params.req.url;
    const extracted = extractUser(params.req);
    if (!params.userId) {
      entry.userId = extracted.id;
      entry.userName = extracted.name;
    }
  }

  try {
    await db.insert(errorLogs).values(entry);
  } catch (err) {
    console.error('Failed to log error:', err);
  }

  if (params.level === 'critical' || params.level === 'error') {
    sendErrorAlert(entry).catch(e => console.error('Failed to send error alert email:', e));
  }
}
