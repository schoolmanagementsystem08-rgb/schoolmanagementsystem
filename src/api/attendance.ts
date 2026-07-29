import { Router } from 'express';
import { db } from '../db';
import { attendance, students, users, classes } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { classId, date } = req.query;
    const conditions: any[] = [];
    if (classId) conditions.push(eq(attendance.studentId, students.id));
    if (date) conditions.push(eq(attendance.date, new Date(date as string)));
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolStudentIds = db.select({ id: students.id }).from(students).where(inArray(students.userId, schoolUserIds));
      conditions.push(inArray(attendance.studentId, schoolStudentIds));
    }

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
      .leftJoin(users, eq(students.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { classId } = req.params;
    const { date } = req.query;

    const studentConditions: any[] = [eq(students.classId, Number(classId))];
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      studentConditions.push(inArray(students.userId, schoolUserIds));
    }
    const classStudents = await db
      .select({
        id: students.id,
        name: users.name,
        email: users.email,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(...studentConditions));

    let records: Record<number, string> = {};
    if (date) {
      const attendanceConditions: any[] = [eq(attendance.date, new Date(date as string))];
      if (schoolId) {
        const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
        const schoolStudentIds = db.select({ id: students.id }).from(students).where(inArray(students.userId, schoolUserIds));
        attendanceConditions.push(inArray(attendance.studentId, schoolStudentIds));
      }
      const rows = await db
        .select()
        .from(attendance)
        .where(and(...attendanceConditions));
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
    const schoolId = (req as any).user?.schoolId;
    const { classId, date, records } = req.body;
    if (!classId || !date || !records) {
      return res.status(400).json({ error: 'classId, date, and records are required' });
    }

    if (schoolId) {
      const [classInfo] = await db.select().from(classes).where(and(eq(classes.id, Number(classId)), eq(classes.schoolId, schoolId))).limit(1);
      if (!classInfo) return res.status(403).json({ error: 'Class does not belong to your school' });
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
