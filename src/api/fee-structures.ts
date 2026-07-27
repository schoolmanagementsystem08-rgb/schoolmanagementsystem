import { Router } from 'express';
import { db } from '../db';
import { feeStructures, feePayments, classes, students, users } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { classId, academicYear, term } = req.query;
    const conditions = [];
    if (classId) conditions.push(eq(feeStructures.classId, Number(classId)));
    if (academicYear) conditions.push(eq(feeStructures.academicYear, String(academicYear)));
    if (term) conditions.push(eq(feeStructures.term, String(term)));

    let query = db
      .select({
        id: feeStructures.id,
        classId: feeStructures.classId,
        className: classes.name,
        academicYear: feeStructures.academicYear,
        term: feeStructures.term,
        totalAmount: feeStructures.totalAmount,
        description: feeStructures.description,
        dueDate: feeStructures.dueDate,
        createdAt: feeStructures.createdAt,
        studentCount: sql<number>`(SELECT COUNT(*) FROM students WHERE students.class_id = ${feeStructures.classId} AND students.status = 'Active')`,
      })
      .from(feeStructures)
      .leftJoin(classes, eq(feeStructures.classId, classes.id));

    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const rows = await query.orderBy(desc(feeStructures.createdAt));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({ error: 'Failed to fetch fee structures' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [structure] = await db
      .select({
        id: feeStructures.id,
        classId: feeStructures.classId,
        className: classes.name,
        academicYear: feeStructures.academicYear,
        term: feeStructures.term,
        totalAmount: feeStructures.totalAmount,
        description: feeStructures.description,
        dueDate: feeStructures.dueDate,
        createdAt: feeStructures.createdAt,
      })
      .from(feeStructures)
      .leftJoin(classes, eq(feeStructures.classId, classes.id))
      .where(eq(feeStructures.id, Number(id)))
      .limit(1);
    if (!structure) return res.status(404).json({ error: 'Fee structure not found' });

    const classStudents = await db
      .select({
        studentId: students.id,
        studentName: users.name,
        studentStudentId: students.studentId,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.classId, structure.classId), eq(students.status, 'Active')))
      .orderBy(users.name);

    const allStudentPayments = await db
      .select({
        studentId: feePayments.studentId,
        totalPaid: sql<number>`COALESCE(SUM(${feePayments.amount}), 0)`,
      })
      .from(feePayments)
      .where(eq(feePayments.structureId, Number(id)))
      .groupBy(feePayments.studentId);

    const paymentMap = new Map(allStudentPayments.map(p => [p.studentId, p.totalPaid]));

    const studentsWithStatus = classStudents.map(s => ({
      ...s,
      totalAmount: structure.totalAmount,
      totalPaid: paymentMap.get(s.studentId) || 0,
      balance: Math.max(0, structure.totalAmount - (paymentMap.get(s.studentId) || 0)),
      paymentStatus: (paymentMap.get(s.studentId) || 0) >= structure.totalAmount ? 'Paid'
        : (paymentMap.get(s.studentId) || 0) > 0 ? 'Partial' : 'Unpaid',
    }));

    res.json({ ...structure, students: studentsWithStatus });
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    res.status(500).json({ error: 'Failed to fetch fee structure' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { classId, academicYear, term, totalAmount, description, dueDate } = req.body;
    if (!classId || !academicYear || !term || !totalAmount) {
      return res.status(400).json({ error: 'classId, academicYear, term, and totalAmount are required' });
    }
    const [existing] = await db
      .select()
      .from(feeStructures)
      .where(and(eq(feeStructures.classId, Number(classId)), eq(feeStructures.academicYear, academicYear), eq(feeStructures.term, term)))
      .limit(1);
    if (existing) return res.status(409).json({ error: 'Fee structure already exists for this class/year/term' });

    const [created] = await db
      .insert(feeStructures)
      .values({ classId: Number(classId), academicYear, term, totalAmount: Number(totalAmount), description: description || null, dueDate: dueDate ? new Date(dueDate) : null })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating fee structure:', error);
    res.status(500).json({ error: 'Failed to create fee structure' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { totalAmount, description, dueDate } = req.body;
    const [existing] = await db.select().from(feeStructures).where(eq(feeStructures.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Fee structure not found' });

    await db
      .update(feeStructures)
      .set({
        ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      })
      .where(eq(feeStructures.id, Number(id)));
    const [updated] = await db.select().from(feeStructures).where(eq(feeStructures.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating fee structure:', error);
    res.status(500).json({ error: 'Failed to update fee structure' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(feeStructures).where(eq(feeStructures.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Fee structure not found' });
    await db.delete(feePayments).where(eq(feePayments.structureId, Number(id)));
    await softDelete('fee_structures', Number(id));
    res.json({ message: 'Fee structure and its payment records deleted' });
  } catch (error) {
    console.error('Error deleting fee structure:', error);
    res.status(500).json({ error: 'Failed to delete fee structure' });
  }
});

export default router;
