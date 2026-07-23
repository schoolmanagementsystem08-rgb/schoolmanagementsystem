import { Router } from 'express';
import { db } from '../db';
import { fees, students, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { studentId } = req.query;
    const query = db
      .select({
        id: fees.id,
        studentId: fees.studentId,
        studentName: users.name,
        amount: fees.amount,
        dueDate: fees.dueDate,
        status: fees.status,
        term: fees.term,
      })
      .from(fees)
      .leftJoin(students, eq(fees.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id));

    if (studentId) query.where(eq(fees.studentId, Number(studentId)));
    const allFees = await query;
    res.json(allFees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, amount, dueDate, status, term } = req.body;
    if (!studentId || !amount || !dueDate || !term) {
      return res.status(400).json({ error: 'studentId, amount, dueDate, and term are required' });
    }
    const [created] = await db
      .insert(fees)
      .values({ studentId: Number(studentId), amount: Number(amount), dueDate: new Date(dueDate), status: status || 'Unpaid', term })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ error: 'Failed to create fee' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, dueDate, status, term } = req.body;
    const [existing] = await db.select().from(fees).where(eq(fees.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Fee not found' });

    await db
      .update(fees)
      .set({
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(status && { status }),
        ...(term && { term }),
      })
      .where(eq(fees.id, Number(id)));
    const [updated] = await db.select().from(fees).where(eq(fees.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ error: 'Failed to update fee' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(fees).where(eq(fees.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Fee not found' });
    await db.delete(fees).where(eq(fees.id, Number(id)));
    res.json({ message: 'Fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ error: 'Failed to delete fee' });
  }
});

export default router;
