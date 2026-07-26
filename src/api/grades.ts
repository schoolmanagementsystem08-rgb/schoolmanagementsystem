import { Router } from 'express';
import { db } from '../db';
import { grades, students, users, subjects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { studentId } = req.query;
    const conditions = [];
    if (studentId) conditions.push(eq(grades.studentId, Number(studentId)));

    const allGrades = await db
      .select({
        id: grades.id,
        studentId: grades.studentId,
        studentName: users.name,
        subjectId: grades.subjectId,
        subjectName: subjects.name,
        score: grades.score,
        maxScore: grades.maxScore,
        term: grades.term,
        createdAt: grades.createdAt,
      })
      .from(grades)
      .leftJoin(students, eq(grades.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(subjects, eq(grades.subjectId, subjects.id));

    res.json(allGrades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, subjectId, score, maxScore, term } = req.body;
    if (!studentId || !subjectId || score === undefined || !maxScore || !term) {
      return res.status(400).json({ error: 'studentId, subjectId, score, maxScore, and term are required' });
    }
    const [created] = await db
      .insert(grades)
      .values({ studentId: Number(studentId), subjectId: Number(subjectId), score: Number(score), maxScore: Number(maxScore), term })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating grade:', error);
    res.status(500).json({ error: 'Failed to create grade' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { score, maxScore, term, subjectId } = req.body;
    const [existing] = await db.select().from(grades).where(eq(grades.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Grade not found' });

    await db
      .update(grades)
      .set({
        ...(score !== undefined && { score: Number(score) }),
        ...(maxScore !== undefined && { maxScore: Number(maxScore) }),
        ...(term && { term }),
        ...(subjectId && { subjectId: Number(subjectId) }),
      })
      .where(eq(grades.id, Number(id)));

    const [updated] = await db
      .select({
        id: grades.id,
        studentId: grades.studentId,
        subjectId: grades.subjectId,
        subjectName: subjects.name,
        score: grades.score,
        maxScore: grades.maxScore,
        term: grades.term,
      })
      .from(grades)
      .leftJoin(subjects, eq(grades.subjectId, subjects.id))
      .where(eq(grades.id, Number(id)))
      .limit(1);

    res.json(updated);
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(grades).where(eq(grades.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Grade not found' });
    await softDelete('grades', Number(id));
    res.json({ message: 'Grade deleted. Backup retained for 30 days.' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({ error: 'Failed to delete grade' });
  }
});

export default router;
