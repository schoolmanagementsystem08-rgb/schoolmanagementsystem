import { Router } from 'express';
import { db } from '../db';
import { classes, teachers, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const allClasses = await db
      .select({
        id: classes.id,
        name: classes.name,
        schoolId: classes.schoolId,
        teacherId: classes.teacherId,
        teacherName: users.name,
        academicYear: classes.academicYear,
      })
      .from(classes)
      .leftJoin(teachers, eq(classes.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id));

    res.json(allClasses);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, academicYear, teacherId } = req.body;
    if (!name || !academicYear) {
      return res.status(400).json({ error: 'Name and academic year are required' });
    }
    const [created] = await db
      .insert(classes)
      .values({ name, academicYear, schoolId: req.body.schoolId || 1, teacherId: teacherId ? Number(teacherId) : null })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, academicYear, teacherId } = req.body;
    const [existing] = await db.select().from(classes).where(eq(classes.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Class not found' });

    await db
      .update(classes)
      .set({
        ...(name && { name }),
        ...(academicYear && { academicYear }),
        ...(teacherId !== undefined && { teacherId: teacherId ? Number(teacherId) : null }),
      })
      .where(eq(classes.id, Number(id)));

    const [updated] = await db
      .select({
        id: classes.id,
        name: classes.name,
        schoolId: classes.schoolId,
        teacherId: classes.teacherId,
        teacherName: users.name,
        academicYear: classes.academicYear,
      })
      .from(classes)
      .leftJoin(teachers, eq(classes.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(classes.id, Number(id)))
      .limit(1);

    res.json(updated);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(classes).where(eq(classes.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Class not found' });
    await softDelete('classes', Number(id));
    res.json({ message: 'Class deleted. Backup retained for 30 days.' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

export default router;
