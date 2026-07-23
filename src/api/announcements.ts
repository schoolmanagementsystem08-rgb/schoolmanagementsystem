import { Router } from 'express';
import { db } from '../db';
import { announcements } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const all = await db
      .select()
      .from(announcements)
      .orderBy(announcements.createdAt);
    res.json(all);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, body, targetRole } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }
    const [created] = await db
      .insert(announcements)
      .values({ title, body, schoolId: req.body.schoolId || 1, targetRole: targetRole || null })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, targetRole } = req.body;
    const [existing] = await db.select().from(announcements).where(eq(announcements.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Announcement not found' });

    await db
      .update(announcements)
      .set({
        ...(title && { title }),
        ...(body && { body }),
        ...(targetRole !== undefined && { targetRole }),
      })
      .where(eq(announcements.id, Number(id)));
    const [updated] = await db.select().from(announcements).where(eq(announcements.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(announcements).where(eq(announcements.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Announcement not found' });
    await db.delete(announcements).where(eq(announcements.id, Number(id)));
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
