import { Router } from 'express';
import { db } from '../db';
import { fees, students, users } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { studentId } = req.query;
    const conditions: any[] = [];
    if (studentId) conditions.push(eq(fees.studentId, Number(studentId)));
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolStudentIds = db.select({ id: students.id }).from(students).where(inArray(students.userId, schoolUserIds));
      conditions.push(inArray(fees.studentId, schoolStudentIds));
    }

    const allFees = await db
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
      .leftJoin(users, eq(students.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    res.json(allFees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

router.post('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { studentId, amount, dueDate, status, term } = req.body;
    if (!studentId || !amount || !dueDate || !term) {
      return res.status(400).json({ error: 'studentId, amount, dueDate, and term are required' });
    }
    if (schoolId) {
      const [student] = await db.select({ id: students.id }).from(students).leftJoin(users, eq(students.userId, users.id)).where(and(eq(students.id, Number(studentId)), eq(users.schoolId, schoolId))).limit(1);
      if (!student) return res.status(403).json({ error: 'Student does not belong to your school' });
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
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const { amount, dueDate, status, term } = req.body;
    const findConditions: any[] = [eq(fees.id, Number(id))];
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolStudentIds = db.select({ id: students.id }).from(students).where(inArray(students.userId, schoolUserIds));
      findConditions.push(inArray(fees.studentId, schoolStudentIds));
    }
    const [existing] = await db.select().from(fees).where(and(...findConditions)).limit(1);
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
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(fees.id, Number(id))];
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolStudentIds = db.select({ id: students.id }).from(students).where(inArray(students.userId, schoolUserIds));
      findConditions.push(inArray(fees.studentId, schoolStudentIds));
    }
    const [existing] = await db.select().from(fees).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Fee not found' });
    await softDelete('fees', Number(id));
    res.json({ message: 'Fee deleted. Backup retained for 30 days.' });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ error: 'Failed to delete fee' });
  }
});

export default router;
