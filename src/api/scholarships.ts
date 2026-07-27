import { Router } from 'express';
import { db } from '../db';
import { scholarships, students, users, classes } from '../db/schema';
import { eq, and, like } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { status, studentId, search } = req.query;
    const conditions = [];

    if (status) conditions.push(eq(scholarships.status, String(status)));
    if (studentId) conditions.push(eq(scholarships.studentId, Number(studentId)));

    let query = db
      .select({
        id: scholarships.id,
        studentId: scholarships.studentId,
        scholarshipName: scholarships.scholarshipName,
        type: scholarships.type,
        discountPercentage: scholarships.discountPercentage,
        amount: scholarships.amount,
        startDate: scholarships.startDate,
        endDate: scholarships.endDate,
        status: scholarships.status,
        notes: scholarships.notes,
        approvedBy: scholarships.approvedBy,
        createdAt: scholarships.createdAt,
        studentName: users.name,
        studentStudentId: students.studentId,
        className: classes.name,
      })
      .from(scholarships)
      .leftJoin(students, eq(scholarships.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id));

    if (conditions.length > 0) query = query.where(and(...conditions));
    if (search) {
      query = query.where(like(users.name, `%${search}%`));
    }

    const all = await query;
    res.json(all);
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    res.status(500).json({ error: 'Failed to fetch scholarships' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [record] = await db
      .select({
        id: scholarships.id,
        studentId: scholarships.studentId,
        scholarshipName: scholarships.scholarshipName,
        type: scholarships.type,
        discountPercentage: scholarships.discountPercentage,
        amount: scholarships.amount,
        startDate: scholarships.startDate,
        endDate: scholarships.endDate,
        status: scholarships.status,
        notes: scholarships.notes,
        approvedBy: scholarships.approvedBy,
        createdAt: scholarships.createdAt,
        studentName: users.name,
        studentStudentId: students.studentId,
        className: classes.name,
      })
      .from(scholarships)
      .leftJoin(students, eq(scholarships.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(scholarships.id, Number(id)))
      .limit(1);

    if (!record) return res.status(404).json({ error: 'Scholarship not found' });
    res.json(record);
  } catch (error) {
    console.error('Error fetching scholarship:', error);
    res.status(500).json({ error: 'Failed to fetch scholarship' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, scholarshipName, type, discountPercentage, amount, startDate, endDate, status, notes, approvedBy } = req.body;
    if (!studentId || !scholarshipName || !type || discountPercentage === undefined || !startDate) {
      return res.status(400).json({ error: 'studentId, scholarshipName, type, discountPercentage, and startDate are required' });
    }
    const [created] = await db
      .insert(scholarships)
      .values({
        studentId: Number(studentId),
        scholarshipName,
        type,
        discountPercentage: Number(discountPercentage),
        amount: amount ? Number(amount) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'Active',
        notes: notes || null,
        approvedBy: approvedBy ? Number(approvedBy) : null,
      })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating scholarship:', error);
    res.status(500).json({ error: 'Failed to create scholarship' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, scholarshipName, type, discountPercentage, amount, startDate, endDate, status, notes, approvedBy } = req.body;
    const [existing] = await db.select().from(scholarships).where(eq(scholarships.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Scholarship not found' });

    await db
      .update(scholarships)
      .set({
        ...(studentId !== undefined && { studentId: Number(studentId) }),
        ...(scholarshipName !== undefined && { scholarshipName }),
        ...(type !== undefined && { type }),
        ...(discountPercentage !== undefined && { discountPercentage: Number(discountPercentage) }),
        ...(amount !== undefined && { amount: amount ? Number(amount) : null }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(approvedBy !== undefined && { approvedBy: approvedBy ? Number(approvedBy) : null }),
      })
      .where(eq(scholarships.id, Number(id)));
    const [updated] = await db.select().from(scholarships).where(eq(scholarships.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating scholarship:', error);
    res.status(500).json({ error: 'Failed to update scholarship' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(scholarships).where(eq(scholarships.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Scholarship not found' });
    await softDelete('scholarships', Number(id));
    res.json({ message: 'Scholarship deleted. Backup retained for 30 days.' });
  } catch (error) {
    console.error('Error deleting scholarship:', error);
    res.status(500).json({ error: 'Failed to delete scholarship' });
  }
});

export default router;
