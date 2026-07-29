import { Router } from 'express';
import { db } from '../db';
import { assignments, subjects, classes } from '../db/schema';
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
      const schoolSubjectIds = db.select({ id: subjects.id }).from(subjects).innerJoin(classes, eq(subjects.classId, classes.id)).where(eq(classes.schoolId, schoolId));
      conditions.push(inArray(assignments.subjectId, schoolSubjectIds));
    }
    const all = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        subjectId: assignments.subjectId,
        subjectName: subjects.name,
        dueDate: assignments.dueDate,
        description: assignments.description,
      })
      .from(assignments)
      .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    res.json(all);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { title, subjectId, dueDate, description } = req.body;
    if (!title || !subjectId || !dueDate) {
      return res.status(400).json({ error: 'title, subjectId, and dueDate are required' });
    }
    const [created] = await db
      .insert(assignments)
      .values({ title, subjectId: Number(subjectId), dueDate: new Date(dueDate), description })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const { title, subjectId, dueDate, description } = req.body;
    const findConditions: any[] = [eq(assignments.id, Number(id))];
    if (schoolId) {
      const schoolSubjectIds = db.select({ id: subjects.id }).from(subjects).innerJoin(classes, eq(subjects.classId, classes.id)).where(eq(classes.schoolId, schoolId));
      findConditions.push(inArray(assignments.subjectId, schoolSubjectIds));
    }
    const [existing] = await db.select().from(assignments).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });

    await db
      .update(assignments)
      .set({
        ...(title && { title }),
        ...(subjectId && { subjectId: Number(subjectId) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(description !== undefined && { description }),
      })
      .where(eq(assignments.id, Number(id)));
    const [updated] = await db.select().from(assignments).where(eq(assignments.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(assignments.id, Number(id))];
    if (schoolId) {
      const schoolSubjectIds = db.select({ id: subjects.id }).from(subjects).innerJoin(classes, eq(subjects.classId, classes.id)).where(eq(classes.schoolId, schoolId));
      findConditions.push(inArray(assignments.subjectId, schoolSubjectIds));
    }
    const [existing] = await db.select().from(assignments).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });
    await softDelete('assignments', Number(id));
    res.json({ message: 'Assignment deleted. Backup retained for 30 days.' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
