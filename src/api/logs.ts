import { Router } from 'express';
import { db } from '../db';
import { activityLogs, errorLogs } from '../db/schema';
import { eq, desc, and, like, gte, lte } from 'drizzle-orm';
import { logActivity, logError } from '../lib/activity-logger';

const router = Router();

router.get('/activity', async (req, res) => {
  try {
    const { action, entity, userId, from, to, limit: limitStr, offset: offsetStr } = req.query;
    const conditions = [];
    if (action) conditions.push(eq(activityLogs.action, String(action)));
    if (entity) conditions.push(eq(activityLogs.entity, String(entity)));
    if (userId) conditions.push(eq(activityLogs.userId, Number(userId)));
    if (from) conditions.push(gte(activityLogs.timestamp, new Date(String(from))));
    if (to) conditions.push(lte(activityLogs.timestamp, new Date(String(to))));

    const limit = Math.min(Number(limitStr) || 100, 500);
    const offset = Number(offsetStr) || 0;

    let query = db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp)).limit(limit).offset(offset);
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;

    const rows = await query;
    res.json(rows);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

router.get('/errors', async (req, res) => {
  try {
    const { level, from, to, limit: limitStr, offset: offsetStr } = req.query;
    const conditions = [];
    if (level) conditions.push(eq(errorLogs.level, String(level)));
    if (from) conditions.push(gte(errorLogs.timestamp, new Date(String(from))));
    if (to) conditions.push(lte(errorLogs.timestamp, new Date(String(to))));

    const limit = Math.min(Number(limitStr) || 100, 500);
    const offset = Number(offsetStr) || 0;

    let query = db.select().from(errorLogs).orderBy(desc(errorLogs.timestamp)).limit(limit).offset(offset);
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;

    const rows = await query;
    res.json(rows);
  } catch (error) {
    console.error('Error fetching error logs:', error);
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [activityCount] = await db.select({ count: activityLogs.id }).from(activityLogs).limit(1);
    const [errorCount] = await db.select({ count: errorLogs.id }).from(errorLogs).limit(1);
    const [recentActivity] = await db.select({ timestamp: activityLogs.timestamp }).from(activityLogs).orderBy(desc(activityLogs.timestamp)).limit(1);
    res.json({
      totalActivities: activityCount?.count || 0,
      totalErrors: errorCount?.count || 0,
      lastActivity: recentActivity?.timestamp || null,
    });
  } catch (error) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({ error: 'Failed to fetch log stats' });
  }
});

router.post('/frontend', async (req, res) => {
  try {
    const { action, entity, entityId, details, page, error } = req.body;

    if (error) {
      await logError({
        message: error.message || 'Frontend error',
        level: error.level || 'error',
        stack: error.stack,
        context: details,
        req,
      });
    }

    if (action) {
      await logActivity({
        action,
        entity,
        entityId,
        details,
        path: page,
        method: 'GET',
        req,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to log frontend event:', err);
    res.status(500).json({ error: 'Failed to log' });
  }
});

export default router;
