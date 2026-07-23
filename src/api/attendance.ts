import { Router } from 'express';
import { db } from '../db';
import { attendance, students, users, classes } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { classId, date } = req.query;
    const conditions = [];
    if (classId) conditions.push(eq(attendance.studentId, students.id));
    if (date) conditions.push(eq(attendance.date, new Date(date as string)));

    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        studentName: users.name,
        subjectId: attendance.subjectId,
        date: attendance.date,
        status: attendance.status,
      })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id));

    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const classStudents = await db
      .select({
        id: students.id,
        name: users.name,
        email: users.email,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(students.classId, Number(classId)));

    let records: Record<number, string> = {};
    if (date) {
      const rows = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.date, new Date(date as string)),
          )
        );
      rows.forEach(r => {
        records[r.studentId] = r.status;
      });
    }

    res.json({ students: classStudents, attendance: records });
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({ error: 'Failed to fetch class attendance' });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !records) {
      return res.status(400).json({ error: 'classId, date, and records are required' });
    }

    const recordDate = new Date(date);

    for (const [studentId, status] of Object.entries(records)) {
      const existing = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.studentId, Number(studentId)),
            eq(attendance.date, recordDate)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(attendance)
          .set({ status: status as string })
          .where(eq(attendance.id, existing[0].id));
      } else {
        await db
          .insert(attendance)
          .values({ studentId: Number(studentId), date: recordDate, status: status as string });
      }
    }

    res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

export default router;
