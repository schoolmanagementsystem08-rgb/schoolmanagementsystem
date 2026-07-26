import { Router } from 'express';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { db } from '../db';
import { teachers, classes, subjects, students, users, attendance, grades, qualifications } from '../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const supabase = createClient(env.SUPABASE_URL || '', env.SUPABASE_ANON_KEY || '');
const router = Router();

async function getTeacherIdFromAuth(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[Teachers] No Bearer token');
    return null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
  if (error || !authUser) {
    console.error('[Teachers] Token verification failed:', error?.message);
    return null;
  }
  const [user] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1);
  if (!user) {
    console.log('[Teachers] No user found for authId:', authUser.id);
    return null;
  }
  const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
  if (!teacher) {
    console.log('[Teachers] No teacher record for userId:', user.id);
    return null;
  }
  console.log('[Teachers] Found teacherId:', teacher.id, 'for userId:', user.id);
  return teacher.id;
}

router.get('/me', async (req, res) => {
  try {
    console.log('[Teachers /me] Request received');
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) {
      console.error('[Teachers /me] Token invalid:', error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    const [user] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1);
    if (!user) {
      console.log('[Teachers /me] No user for authId:', authUser.id);
      return res.status(404).json({ error: 'User not found' });
    }
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
    if (!teacher) {
      console.log('[Teachers /me] No teacher record for userId:', user.id);
      return res.status(404).json({ error: 'Teacher record not found. Contact admin.' });
    }
    res.json(teacher);
  } catch (error: any) {
    console.error('[Teachers /me] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

router.get('/me/classes', async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromAuth(req.headers.authorization);
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });
    const teacherClasses = await db.select().from(classes).where(eq(classes.teacherId, teacherId));
    res.json(teacherClasses);
  } catch (error: any) {
    console.error('[Teachers /me/classes] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /me/subjects] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /me/students] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /me/grades] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /me/attendance] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /:id] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

router.get('/:id/classes', async (req, res) => {
  try {
    const teacherClasses = await db.select().from(classes).where(eq(classes.teacherId, Number(req.params.id)));
    res.json(teacherClasses);
  } catch (error: any) {
    console.error('[Teachers /:id/classes] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /:id/subjects] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /:id/students] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /:id/grades] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /:id/attendance] Error:', error?.message);
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
  } catch (error: any) {
    console.error('[Teachers /attendance/report] Error:', error?.message);
    res.status(500).json({ error: 'Failed to generate attendance report' });
  }
});

router.get('/', async (req, res) => {
  try {
    const allTeachers = await db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        name: users.name,
        email: users.email,
        employeeId: teachers.employeeId,
        specialization: teachers.specialization,
        phone: teachers.phone,
        status: teachers.status,
        portalAccess: teachers.portalAccess,
        createdAt: teachers.createdAt,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .orderBy(users.name);

    const teacherIds = allTeachers.map(t => t.id);
    let classCounts: Record<number, number> = {};
    if (teacherIds.length > 0) {
      const classRows = await db
        .select({ teacherId: classes.teacherId, count: sql<number>`count(*)` })
        .from(classes)
        .where(inArray(classes.teacherId, teacherIds))
        .groupBy(classes.teacherId);
      for (const row of classRows) {
        classCounts[row.teacherId] = Number(row.count);
      }
    }

    const result = allTeachers.map(t => ({
      ...t,
      classCount: classCounts[t.id] || 0,
    }));

    res.json(result);
  } catch (error: any) {
    console.error('[Teachers GET /] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, specialization, phone, employeeId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const [createdUser] = await db.insert(users).values({
      authId: randomUUID(),
      name,
      email,
      role: 'teacher',
    }).returning();

    const [createdTeacher] = await db.insert(teachers).values({
      userId: createdUser.id,
      employeeId: employeeId || null,
      specialization: specialization || 'General',
      phone: phone || null,
    }).returning();

    res.status(201).json({
      id: createdTeacher.id,
      userId: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      employeeId: createdTeacher.employeeId,
      specialization: createdTeacher.specialization,
      phone: createdTeacher.phone,
    });
  } catch (error: any) {
    console.error('[Teachers POST /] Error:', error?.message);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const [existing] = await db.select().from(teachers).where(eq(teachers.id, teacherId)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Teacher not found' });

    const { name, email, specialization, phone, employeeId, status, portalAccess, qualification } = req.body;

    if (name || email) {
      await db.update(users).set({
        ...(name && { name }),
        ...(email && { email }),
      }).where(eq(users.id, existing.userId));
    }

    await db.update(teachers).set({
      ...(specialization !== undefined && { specialization }),
      ...(phone !== undefined && { phone }),
      ...(employeeId !== undefined && { employeeId }),
      ...(status !== undefined && { status }),
      ...(portalAccess !== undefined && { portalAccess }),
    }).where(eq(teachers.id, teacherId));

    if (qualification?.degree) {
      const [qual] = await db.select().from(qualifications).where(eq(qualifications.teacherId, teacherId)).limit(1);
      if (qual) {
        await db.update(qualifications).set({
          degree: qualification.degree,
          institution: qualification.institution,
          field: qualification.field || null,
          year: qualification.year || null,
        }).where(eq(qualifications.id, qual.id));
      } else {
        await db.insert(qualifications).values({
          teacherId,
          degree: qualification.degree,
          institution: qualification.institution,
          field: qualification.field || null,
          year: qualification.year || null,
        });
      }
    }

    const [updated] = await db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        name: users.name,
        email: users.email,
        employeeId: teachers.employeeId,
        specialization: teachers.specialization,
        phone: teachers.phone,
        status: teachers.status,
        portalAccess: teachers.portalAccess,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.id, teacherId))
      .limit(1);

    res.json(updated);
  } catch (error: any) {
    console.error('[Teachers PUT /:id] Error:', error?.message);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const [existing] = await db.select().from(teachers).where(eq(teachers.id, teacherId)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Teacher not found' });

    await db.update(classes).set({ teacherId: null }).where(eq(classes.teacherId, teacherId));
    await db.delete(teachers).where(eq(teachers.id, teacherId));
    await db.delete(users).where(eq(users.id, existing.userId));

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error: any) {
    console.error('[Teachers DELETE /:id] Error:', error?.message);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

router.get('/:id/classes/available', async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    const available = await db
      .select({
        id: classes.id,
        name: classes.name,
        academicYear: classes.academicYear,
        currentTeacherId: classes.teacherId,
      })
      .from(classes)
      .where(sql`${classes.teacherId} IS NULL OR ${classes.teacherId} = ${teacherId}`)
      .orderBy(classes.name);
    res.json(available);
  } catch (error: any) {
    console.error('[Teachers /:id/classes/available] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch available classes' });
  }
});

export default router;
