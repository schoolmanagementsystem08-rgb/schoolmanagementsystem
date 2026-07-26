import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { students, users, classes, guardians, fees } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const allStudents = await db
      .select({
        id: students.id,
        studentId: students.studentId,
        name: users.name,
        email: users.email,
        gender: students.gender,
        classId: students.classId,
        className: classes.name,
        academicYear: classes.academicYear,
        enrollmentDate: students.enrollmentDate,
        status: students.status,
        guardianId: students.guardianId,
        guardianName: guardians.name,
        guardianPhone: guardians.phone,
        guardianEmail: guardians.email,
        guardianRelationship: guardians.relationship,
        balance: sql<string>`COALESCE((SELECT SUM(CASE WHEN f.status = 'Paid' THEN 0 ELSE f.amount END) - SUM(CASE WHEN f.status = 'Paid' THEN f.amount ELSE 0 END) FROM ${fees} f WHERE f.student_id = ${students.id}), 0)`,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(guardians, eq(students.guardianId, guardians.id));
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
        studentId: students.studentId,
        name: users.name,
        email: users.email,
        gender: students.gender,
        classId: students.classId,
        className: classes.name,
        academicYear: classes.academicYear,
        enrollmentDate: students.enrollmentDate,
        status: students.status,
        guardianId: students.guardianId,
        guardianName: guardians.name,
        guardianPhone: guardians.phone,
        guardianEmail: guardians.email,
        guardianAddress: guardians.address,
        guardianRelationship: guardians.relationship,
        balance: sql<string>`COALESCE((SELECT SUM(CASE WHEN f.status = 'Paid' THEN 0 ELSE f.amount END) - SUM(CASE WHEN f.status = 'Paid' THEN f.amount ELSE 0 END) FROM ${fees} f WHERE f.student_id = ${students.id}), 0)`,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(guardians, eq(students.guardianId, guardians.id))
      .where(eq(students.id, Number(id)))
      .limit(1);
    if (student.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(student[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

async function generateStudentId(classId: number): Promise<string> {
  const [cls] = await db.select({ name: classes.name, academicYear: classes.academicYear }).from(classes).where(eq(classes.id, classId)).limit(1);
  if (!cls) return `UNKNOWN-${Date.now()}`;
  const prefix = cls.name.split(' ')[0];
  const year = cls.academicYear;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.classId, classId));
  const seq = String((result.count || 0) + 1).padStart(3, '0');
  return `${prefix}-${year}-${seq}`;
}

router.post('/', async (req, res) => {
  try {
    const { name, email, classId, gender, status, guardian } = req.body;
    if (!name || !email || !classId) {
      return res.status(400).json({ error: 'Name, email, and class are required' });
    }

    let guardianId: number | null = null;
    if (guardian?.name) {
      const [existingGuardian] = guardian.email
        ? await db.select().from(guardians).where(eq(guardians.email, guardian.email)).limit(1)
        : [];
      if (existingGuardian) {
        guardianId = existingGuardian.id;
      } else {
        const [created] = await db.insert(guardians).values({
          name: guardian.name,
          phone: guardian.phone || null,
          email: guardian.email || null,
          address: guardian.address || null,
          relationship: guardian.relationship || null,
        }).returning();
        guardianId = created.id;
      }
    }

    const [user] = await db.insert(users).values({
      authId: randomUUID(),
      name,
      email,
      role: 'student',
    }).returning();

    const studentId = await generateStudentId(Number(classId));

    const [student] = await db.insert(students).values({
      userId: user.id,
      classId: Number(classId),
      studentId,
      gender: gender || null,
      guardianId,
      status: status || 'Active',
    }).returning();

    const [created] = await db
      .select({
        id: students.id, studentId: students.studentId, name: users.name, email: users.email,
        gender: students.gender, classId: students.classId, className: classes.name,
        academicYear: classes.academicYear, enrollmentDate: students.enrollmentDate,
        status: students.status, guardianId: students.guardianId,
        guardianName: guardians.name, guardianPhone: guardians.phone,
        guardianEmail: guardians.email, guardianRelationship: guardians.relationship,
        balance: sql<string>`0`,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(guardians, eq(students.guardianId, guardians.id))
      .where(eq(students.id, student.id)).limit(1);

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, classId, gender, status, guardian } = req.body;

    const [existing] = await db.select({ userId: students.userId, classId: students.classId }).from(students).where(eq(students.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Student not found' });

    if (name || email) {
      await db.update(users).set({ ...(name && { name }), ...(email && { email }) }).where(eq(users.id, existing.userId));
    }

    let guardianId: number | null = undefined;
    if (guardian) {
      if (guardian.name) {
        const [existingGuardian] = guardian.email
          ? await db.select().from(guardians).where(eq(guardians.email, guardian.email)).limit(1)
          : [];
        if (existingGuardian) {
          guardianId = existingGuardian.id;
        } else {
          const [created] = await db.insert(guardians).values({
            name: guardian.name,
            phone: guardian.phone || null,
            email: guardian.email || null,
            address: guardian.address || null,
            relationship: guardian.relationship || null,
          }).returning();
          guardianId = created.id;
        }
      } else {
        guardianId = null;
      }
    }

    const updateData: any = {};
    if (classId) updateData.classId = Number(classId);
    if (gender !== undefined) updateData.gender = gender;
    if (status) updateData.status = status;
    if (guardianId !== undefined) updateData.guardianId = guardianId;
    if (classId && Number(classId) !== existing.classId) {
      updateData.studentId = await generateStudentId(Number(classId));
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(students).set(updateData).where(eq(students.id, Number(id)));
    }

    const [updated] = await db
      .select({
        id: students.id, studentId: students.studentId, name: users.name, email: users.email,
        gender: students.gender, classId: students.classId, className: classes.name,
        academicYear: classes.academicYear, enrollmentDate: students.enrollmentDate,
        status: students.status, guardianId: students.guardianId,
        guardianName: guardians.name, guardianPhone: guardians.phone,
        guardianEmail: guardians.email, guardianRelationship: guardians.relationship,
        balance: sql<string>`COALESCE((SELECT SUM(CASE WHEN f.status = 'Paid' THEN 0 ELSE f.amount END) - SUM(CASE WHEN f.status = 'Paid' THEN f.amount ELSE 0 END) FROM ${fees} f WHERE f.student_id = ${students.id}), 0)`,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(guardians, eq(students.guardianId, guardians.id))
      .where(eq(students.id, Number(id))).limit(1);

    res.json(updated);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select({ userId: students.userId }).from(students).where(eq(students.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Student not found' });
    await db.delete(students).where(eq(students.id, Number(id)));
    await db.delete(users).where(eq(users.id, existing.userId));
    res.json({ message: 'Student deleted permanently' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

router.get('/:id/fees', async (req, res) => {
  try {
    const { id } = req.params;
    const feeRecords = await db.select().from(fees).where(eq(fees.studentId, Number(id))).orderBy(fees.dueDate);
    res.json(feeRecords);
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

export default router;
