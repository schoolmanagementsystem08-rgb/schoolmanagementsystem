import { Router } from 'express';
import { db } from '../db';
import { feePayments, feeStructures, students, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { studentId, structureId } = req.query;
    const conditions = [];
    if (studentId) conditions.push(eq(feePayments.studentId, Number(studentId)));
    if (structureId) conditions.push(eq(feePayments.structureId, Number(structureId)));

    let query = db
      .select({
        id: feePayments.id,
        studentId: feePayments.studentId,
        studentName: users.name,
        structureId: feePayments.structureId,
        amount: feePayments.amount,
        paymentDate: feePayments.paymentDate,
        paymentMethod: feePayments.paymentMethod,
        referenceNo: feePayments.referenceNo,
        notes: feePayments.notes,
        recordedBy: feePayments.recordedBy,
        createdAt: feePayments.createdAt,
        academicYear: feeStructures.academicYear,
        term: feeStructures.term,
      })
      .from(feePayments)
      .leftJoin(students, eq(feePayments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(feeStructures, eq(feePayments.structureId, feeStructures.id));

    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const rows = await query.orderBy(desc(feePayments.paymentDate));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching fee payments:', error);
    res.status(500).json({ error: 'Failed to fetch fee payments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, structureId, amount, paymentDate, paymentMethod, referenceNo, notes, recordedBy } = req.body;
    if (!studentId || !structureId || !amount) {
      return res.status(400).json({ error: 'studentId, structureId, and amount are required' });
    }

    const [structure] = await db.select().from(feeStructures).where(eq(feeStructures.id, Number(structureId))).limit(1);
    if (!structure) return res.status(404).json({ error: 'Fee structure not found' });

    const [created] = await db
      .insert(feePayments)
      .values({
        studentId: Number(studentId),
        structureId: Number(structureId),
        amount: Number(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || null,
        referenceNo: referenceNo || null,
        notes: notes || null,
        recordedBy: recordedBy ? Number(recordedBy) : null,
      })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating fee payment:', error);
    res.status(500).json({ error: 'Failed to create fee payment' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, referenceNo, notes } = req.body;
    const [existing] = await db.select().from(feePayments).where(eq(feePayments.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Payment not found' });

    await db
      .update(feePayments)
      .set({
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(paymentDate !== undefined && { paymentDate: new Date(paymentDate) }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(referenceNo !== undefined && { referenceNo }),
        ...(notes !== undefined && { notes }),
      })
      .where(eq(feePayments.id, Number(id)));
    const [updated] = await db.select().from(feePayments).where(eq(feePayments.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(feePayments).where(eq(feePayments.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Payment not found' });
    await softDelete('fee_payments', Number(id));
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

export default router;
