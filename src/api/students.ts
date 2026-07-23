import { Router } from 'express';
import { db } from '../db';
import { students, users, classes } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const allStudents = await db
      .select({
        id: students.id,
        name: users.name,
        email: users.email,
        classId: students.classId,
        className: classes.name,
        enrollmentDate: students.enrollmentDate,
        guardianId: students.guardianId,
        status: students.status,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id));

    res.json(allStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await db
      .select({
        id: students.id,
        userId: students.userId,
        name: users.name,
        email: users.email,
        classId: students.classId,
        className: classes.name,
        enrollmentDate: students.enrollmentDate,
        guardianId: students.guardianId,
        status: students.status,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.id, Number(id)))
      .limit(1);

    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, classId, status } = req.body;

    if (!name || !email || !classId) {
      return res.status(400).json({ error: 'Name, email, and class are required' });
    }

    const [user] = await db
      .insert(users)
      .values({
        clerkId: `student_${Date.now()}`,
        name,
        email,
        role: 'student',
      })
      .returning();

    const [student] = await db
      .insert(students)
      .values({
        userId: user.id,
        classId: Number(classId),
        status: status || 'Active',
      })
      .returning();

    const [created] = await db
      .select({
        id: students.id,
        name: users.name,
        email: users.email,
        classId: students.classId,
        className: classes.name,
        enrollmentDate: students.enrollmentDate,
        status: students.status,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.id, student.id))
      .limit(1);

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, classId, status } = req.body;

    const [existing] = await db
      .select({ userId: students.userId })
      .from(students)
      .where(eq(students.id, Number(id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (name || email) {
      await db
        .update(users)
        .set({ ...(name && { name }), ...(email && { email }) })
        .where(eq(users.id, existing.userId));
    }

    await db
      .update(students)
      .set({
        ...(classId && { classId: Number(classId) }),
        ...(status && { status }),
      })
      .where(eq(students.id, Number(id)));

    const [updated] = await db
      .select({
        id: students.id,
        name: users.name,
        email: users.email,
        classId: students.classId,
        className: classes.name,
        enrollmentDate: students.enrollmentDate,
        status: students.status,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.id, Number(id)))
      .limit(1);

    res.json(updated);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select({ userId: students.userId })
      .from(students)
      .where(eq(students.id, Number(id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await db.delete(students).where(eq(students.id, Number(id)));
    await db.delete(users).where(eq(users.id, existing.userId));

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;
