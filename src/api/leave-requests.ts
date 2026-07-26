import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { db } from '../db';
import { leaveRequests, teachers, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const supabase = createClient(env.SUPABASE_URL || '', env.SUPABASE_ANON_KEY || '');
const router = Router();

router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid token' });

    const [user] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
    if (!teacher) return res.status(404).json({ error: 'Teacher record not found' });

    const { type, reason, startDate, endDate } = req.body;
    if (!type || !reason || !startDate || !endDate) {
      return res.status(400).json({ error: 'Type, reason, start date, and end date are required' });
    }

    const [created] = await db.insert(leaveRequests).values({
      teacherId: teacher.id,
      type,
      reason,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    }).returning();

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = db
      .select({
        id: leaveRequests.id,
        teacherId: leaveRequests.teacherId,
        teacherName: users.name,
        type: leaveRequests.type,
        reason: leaveRequests.reason,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        status: leaveRequests.status,
        adminNote: leaveRequests.adminNote,
        createdAt: leaveRequests.createdAt,
      })
      .from(leaveRequests)
      .leftJoin(teachers, eq(leaveRequests.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id));

    if (status && status !== 'all') {
      query = query.where(eq(leaveRequests.status, status as string)) as any;
    }

    const result = await query.orderBy(leaveRequests.createdAt);
    res.json(result);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const [existing] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Leave request not found' });
    await db.update(leaveRequests).set({ status, adminNote: adminNote || null }).where(eq(leaveRequests.id, Number(id)));
    const [updated] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

export default router;
