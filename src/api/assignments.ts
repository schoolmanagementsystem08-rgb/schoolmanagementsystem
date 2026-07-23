import { Router } from 'express';
import { db } from '../db';
import { assignments, subjects } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
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
      .leftJoin(subjects, eq(assignments.subjectId, subjects.id));
    res.json(all);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/', async (req, res) => {
  try {
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
    const { id } = req.params;
    const { title, subjectId, dueDate, description } = req.body;
    const [existing] = await db.select().from(assignments).where(eq(assignments.id, Number(id))).limit(1);
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
    const { id } = req.params;
    const [existing] = await db.select().from(assignments).where(eq(assignments.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });
    await db.delete(assignments).where(eq(assignments.id, Number(id)));
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
