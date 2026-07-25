import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { db } from '../db';
import { teachers, classes, subjects, students, users, attendance, grades } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const supabase = createClient(env.SUPABASE_URL || '', env.SUPABASE_ANON_KEY || '');
const router = Router();

async function getTeacherIdFromAuth(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
  if (error || !authUser) return null;
  const [user] = await db.select().from(users).where(eq(users.clerkId, authUser.id)).limit(1);
  if (!user) return null;
  const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
  return teacher?.id || null;
}

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid token' });
    const [user] = await db.select().from(users).where(eq(users.clerkId, authUser.id)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [teacher] = await db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        name: users.name,
        email: users.email,
        employeeId: teachers.employeeId,
        specialization: teachers.specialization,
        phone: teachers.phone,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.userId, user.id))
      .limit(1);
    if (!teacher) return res.status(404).json({ error: 'Teacher record not found. Contact admin.' });
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

router.get('/me/classes', async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromAuth(req.headers.authorization);
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });
    const teacherClasses = await db.select().from(classes).where(eq(classes.teacherId, teacherId));
    res.json(teacherClasses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

router.get('/me/subjects', async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromAuth(req.headers.authorization);
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });
    const teacherSubjects = await db
      .select({ id: subjects.id, name: subjects.name, classId: subjects.classId, className: classes.name })
      .from(subjects).leftJoin(classes, eq(subjects.classId, classes.id))
      .where(eq(subjects.teacherId, teacherId));
    res.json(teacherSubjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.get('/me/students', async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromAuth(req.headers.authorization);
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });
    const teacherClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.teacherId, teacherId));
    if (teacherClasses.length === 0) return res.json([]);
    const classIds = teacherClasses.map(c => c.id);
    const classStudents = await db
      .select({ id: students.id, name: users.name, email: users.email, classId: students.classId, className: classes.name, status: students.status })
      .from(students).leftJoin(users, eq(students.userId, users.id)).leftJoin(classes, eq(students.classId, classes.id))
      .where(inArray(students.classId, classIds));
    res.json(classStudents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.get('/me/grades', async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromAuth(req.headers.authorization);
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });
    const teacherSubjects = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.teacherId, teacherId));
    if (teacherSubjects.length === 0) return res.json([]);
    const subjectIds = teacherSubjects.map(s => s.id);
    const gradeRecords = await db
      .select({ id: grades.id, studentId: grades.studentId, studentName: users.name, subjectId: grades.subjectId, subjectName: subjects.name, score: grades.score, maxScore: grades.maxScore, term: grades.term, createdAt: grades.createdAt })
      .from(grades).leftJoin(students, eq(grades.studentId, students.id)).leftJoin(users, eq(students.userId, users.id)).leftJoin(subjects, eq(grades.subjectId, subjects.id))
      .where(inArray(grades.subjectId, subjectIds));
    res.json(gradeRecords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

router.get('/me/attendance', async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromAuth(req.headers.authorization);
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });
    const { date } = req.query;
    const teacherClasses = await db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.teacherId, teacherId));
    if (teacherClasses.length === 0) return res.json([]);
    const classIds = teacherClasses.map(c => c.id);
    const conditions = [inArray(attendance.studentId,
      db.select({ id: students.id }).from(students).where(inArray(students.classId, classIds))
    )];
    if (date) conditions.push(eq(attendance.date, new Date(date as string)));
    const records = await db
      .select({ id: attendance.id, studentId: attendance.studentId, studentName: users.name, date: attendance.date, status: attendance.status, className: classes.name })
      .from(attendance).leftJoin(students, eq(attendance.studentId, students.id)).leftJoin(users, eq(students.userId, users.id)).leftJoin(classes, eq(students.classId, classes.id))
      .where(and(...conditions));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [teacher] = await db
      .select({ id: teachers.id, name: users.name, email: users.email, employeeId: teachers.employeeId, specialization: teachers.specialization, phone: teachers.phone })
      .from(teachers).leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.id, Number(req.params.id))).limit(1);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

router.get('/:id/classes', async (req, res) => {
  try {
    const teacherClasses = await db.select().from(classes).where(eq(classes.teacherId, Number(req.params.id)));
    res.json(teacherClasses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher classes' });
  }
});

router.get('/:id/subjects', async (req, res) => {
  try {
    const teacherSubjects = await db
      .select({ id: subjects.id, name: subjects.name, classId: subjects.classId, className: classes.name })
      .from(subjects).leftJoin(classes, eq(subjects.classId, classes.id))
      .where(eq(subjects.teacherId, Number(req.params.id)));
    res.json(teacherSubjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher subjects' });
  }
});

router.get('/:id/students', async (req, res) => {
  try {
    const teacherClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.teacherId, Number(req.params.id)));
    if (teacherClasses.length === 0) return res.json([]);
    const classIds = teacherClasses.map(c => c.id);
    const classStudents = await db
      .select({ id: students.id, name: users.name, email: users.email, classId: students.classId, className: classes.name, status: students.status })
      .from(students).leftJoin(users, eq(students.userId, users.id)).leftJoin(classes, eq(students.classId, classes.id))
      .where(inArray(students.classId, classIds));
    res.json(classStudents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher students' });
  }
});

router.get('/:id/grades', async (req, res) => {
  try {
    const teacherSubjects = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.teacherId, Number(req.params.id)));
    if (teacherSubjects.length === 0) return res.json([]);
    const subjectIds = teacherSubjects.map(s => s.id);
    const gradeRecords = await db
      .select({ id: grades.id, studentId: grades.studentId, studentName: users.name, subjectId: grades.subjectId, subjectName: subjects.name, score: grades.score, maxScore: grades.maxScore, term: grades.term, createdAt: grades.createdAt })
      .from(grades).leftJoin(students, eq(grades.studentId, students.id)).leftJoin(users, eq(students.userId, users.id)).leftJoin(subjects, eq(grades.subjectId, subjects.id))
      .where(inArray(grades.subjectId, subjectIds));
    res.json(gradeRecords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher grades' });
  }
});

router.get('/:id/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    const teacherClasses = await db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.teacherId, Number(req.params.id)));
    if (teacherClasses.length === 0) return res.json([]);
    const classIds = teacherClasses.map(c => c.id);
    const conditions = [inArray(attendance.studentId,
      db.select({ id: students.id }).from(students).where(inArray(students.classId, classIds))
    )];
    if (date) conditions.push(eq(attendance.date, new Date(date as string)));
    const records = await db
      .select({ id: attendance.id, studentId: attendance.studentId, studentName: users.name, date: attendance.date, status: attendance.status, className: classes.name })
      .from(attendance).leftJoin(students, eq(attendance.studentId, students.id)).leftJoin(users, eq(students.userId, users.id)).leftJoin(classes, eq(students.classId, classes.id))
      .where(and(...conditions));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher attendance' });
  }
});

router.post('/attendance/report', async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !records) return res.status(400).json({ error: 'classId, date, and records are required' });
    const [classInfo] = await db.select().from(classes).where(eq(classes.id, Number(classId))).limit(1);
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 500]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('ATTENDANCE REPORT', { x: 50, y: 460, size: 20, font, color: rgb(0, 0, 0) });
    page.drawText(`Class: ${classInfo.name}`, { x: 50, y: 430, size: 12, font: fontRegular });
    page.drawText(`Date: ${new Date(date).toLocaleDateString()}`, { x: 50, y: 410, size: 12, font: fontRegular });
    let y = 370;
    page.drawText('Student', { x: 50, y, size: 11, font });
    page.drawText('Status', { x: 350, y, size: 11, font });
    y -= 20;
    for (const [studentName, status] of Object.entries(records)) {
      page.drawText(studentName, { x: 50, y, size: 10, font: fontRegular });
      page.drawText(status as string, { x: 350, y, size: 10, font: fontRegular });
      y -= 18;
    }
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${classInfo.name}_${date}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate attendance report' });
  }
});

export default router;
