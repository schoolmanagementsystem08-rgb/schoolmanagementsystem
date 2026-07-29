import { Router } from 'express';
import { db } from '../db';
import { subjects, classes } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const conditions: any[] = [];
    if (schoolId) {
      const schoolClassIds = db.select({ id: classes.id }).from(classes).where(eq(classes.schoolId, schoolId));
      conditions.push(inArray(subjects.classId, schoolClassIds));
    }
    const all = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        classId: subjects.classId,
        className: classes.name,
        teacherId: subjects.teacherId,
      })
      .from(subjects)
      .leftJoin(classes, eq(subjects.classId, classes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    res.json(all);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, classId, teacherId } = req.body;
    if (!name || !classId) return res.status(400).json({ error: 'Name and class are required' });
    const [created] = await db.insert(subjects).values({
      name,
      classId: Number(classId),
      teacherId: teacherId ? Number(teacherId) : null,
    }).returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const { name, classId, teacherId } = req.body;
    const findConditions: any[] = [eq(subjects.id, Number(id))];
    if (schoolId) {
      const schoolClassIds = db.select({ id: classes.id }).from(classes).where(eq(classes.schoolId, schoolId));
      findConditions.push(inArray(subjects.classId, schoolClassIds));
    }
    const [existing] = await db.select().from(subjects).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Subject not found' });
    const updateData: any = {};
    if (name) updateData.name = name;
    if (classId) updateData.classId = Number(classId);
    if (teacherId !== undefined) updateData.teacherId = teacherId ? Number(teacherId) : null;
    await db.update(subjects).set(updateData).where(eq(subjects.id, Number(id)));
    const [updated] = await db.select().from(subjects).where(eq(subjects.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(subjects.id, Number(id))];
    if (schoolId) {
      const schoolClassIds = db.select({ id: classes.id }).from(classes).where(eq(classes.schoolId, schoolId));
      findConditions.push(inArray(subjects.classId, schoolClassIds));
    }
    const [existing] = await db.select().from(subjects).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Subject not found' });
    await softDelete('subjects', Number(id));
    res.json({ message: 'Subject deleted. Backup retained for 30 days.' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

export default router;
