import { Router } from 'express';
import { db } from '../db';
import { announcements } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const conditions: any[] = [];
    if (schoolId) conditions.push(eq(announcements.schoolId, schoolId));
    const all = await db
      .select()
      .from(announcements)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(announcements.createdAt);
    res.json(all);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.post('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { title, body, targetRole } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }
    const [created] = await db
      .insert(announcements)
      .values({ title, body, schoolId: schoolId ?? req.body.schoolId, targetRole: targetRole || null })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const { title, body, targetRole } = req.body;
    const findConditions: any[] = [eq(announcements.id, Number(id))];
    if (schoolId) findConditions.push(eq(announcements.schoolId, schoolId));
    const [existing] = await db.select().from(announcements).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Announcement not found' });

    const updateConditions: any[] = [eq(announcements.id, Number(id))];
    if (schoolId) updateConditions.push(eq(announcements.schoolId, schoolId));
    await db
      .update(announcements)
      .set({
        ...(title && { title }),
        ...(body && { body }),
        ...(targetRole !== undefined && { targetRole }),
      })
      .where(and(...updateConditions));
    const [updated] = await db.select().from(announcements).where(eq(announcements.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(announcements.id, Number(id))];
    if (schoolId) findConditions.push(eq(announcements.schoolId, schoolId));
    const [existing] = await db.select().from(announcements).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Announcement not found' });
    await softDelete('announcements', Number(id));
    res.json({ message: 'Announcement deleted. Backup retained for 30 days.' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
