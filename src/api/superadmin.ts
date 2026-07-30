import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db';
import { users, schools, teachers, students, classes, subjects, guardians, qualifications, teacherSalaries, payrollRecords, leaveRequests, fees, feePayments, feeStructures, attendance, timetable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import { env } from '../config/env';

const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.SUPABASE_URL || '', env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const router = Router();

function requireSuperAdmin(req: any, res: any) {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(403).json({ error: 'Super admin only' });
    return false;
  }
  return true;
}

router.get('/overview', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const result = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM schools) as "totalSchools",
        (SELECT COUNT(*) FROM users) as "totalUsers",
        (SELECT COUNT(*) FROM students) as "totalStudents",
        (SELECT COUNT(*) FROM teachers) as "totalTeachers",
        (SELECT COUNT(*) FROM classes) as "totalClasses",
        (SELECT COUNT(*) FROM subjects) as "totalSubjects",
        (SELECT COUNT(*) FROM attendance) as "totalAttendance",
        (SELECT COUNT(*) FROM fees) as "totalFees",
        (SELECT COUNT(*) FROM fee_payments) as "totalPayments",
        (SELECT COUNT(*) FROM leave_requests) as "totalLeaves",
        (SELECT COUNT(*) FROM payroll_records) as "totalPayrolls",
        (SELECT COALESCE(SUM(amount), 0) FROM fee_payments) as "collectedFees",
        (SELECT COUNT(*) FROM users WHERE role='admin') as "totalAdmins",
        (SELECT COUNT(*) FROM users WHERE role='parent') as "totalParents"
    `);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/schools/detail', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const rows = await db.execute(sql`
      SELECT
        s.*,
        u.name as "adminName",
        u.email as "adminEmail",
        (SELECT COUNT(*) FROM users WHERE school_id = s.id) as "userCount",
        (SELECT COUNT(*) FROM teachers WHERE school_id = s.id) as "teacherCount",
        (SELECT COUNT(*) FROM students WHERE school_id = s.id) as "studentCount",
        (SELECT COUNT(*) FROM classes WHERE school_id = s.id) as "classCount"
      FROM schools s
      LEFT JOIN users u ON u.id = s.admin_id
      ORDER BY s.name
    `);
    res.json(rows.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const rows = await db.execute(sql`
      SELECT
        u.id, u.name, u.email, u.role, u.school_id, u.created_at,
        s.name as "schoolName"
      FROM users u
      LEFT JOIN schools s ON s.id = u.school_id
      ORDER BY u.created_at DESC
    `);
    res.json(rows.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/teachers', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const rows = await db.execute(sql`
      SELECT
        t.id, t.user_id, t.employee_id, t.specialization, t.phone, t.status as "teacherStatus", t.portal_access, t.school_id, t.created_at,
        u.name, u.email,
        s.name as "schoolName",
        (SELECT json_agg(json_build_object('id', q.id, 'degree', q.degree, 'institution', q.institution, 'field', q.field, 'year', q.year))
         FROM qualifications q WHERE q.teacher_id = t.id) as qualifications,
        (SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
         FROM classes c WHERE c.teacher_id = t.id) as headClasses,
        (SELECT json_agg(json_build_object('id', sub.id, 'name', sub.name))
         FROM subjects sub WHERE sub.teacher_id = t.id) as subjects,
        (SELECT json_agg(json_build_object('id', ts.id, 'basicSalary', ts.basic_salary, 'status', ts.status))
         FROM teacher_salaries ts WHERE ts.teacher_id = t.id) as salaries
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN schools s ON s.id = t.school_id
      ORDER BY u.name
    `);
    res.json(rows.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/students', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const rows = await db.execute(sql`
      SELECT
        st.id, st.user_id, st.class_id, st.student_id, st.gender, st.enrollment_date, st.guardian_id, st.status as "studentStatus", st.school_id,
        u.name, u.email,
        c.name as "className",
        s.name as "schoolName",
        json_build_object('id', g.id, 'name', g.name, 'phone', g.phone, 'email', g.email, 'relationship', g.relationship) as guardian
      FROM students st
      JOIN users u ON u.id = st.user_id
      LEFT JOIN classes c ON c.id = st.class_id
      LEFT JOIN schools s ON s.id = st.school_id
      LEFT JOIN guardians g ON g.id = st.guardian_id
      ORDER BY u.name
    `);
    res.json(rows.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/classes', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const rows = await db.execute(sql`
      SELECT
        c.id, c.name, c.school_id, c.teacher_id, c.academic_year,
        s.name as "schoolName",
        u.name as "headTeacherName",
        u.email as "headTeacherEmail",
        (SELECT COUNT(*) FROM students st WHERE st.class_id = c.id) as "studentCount",
        (SELECT COUNT(*) FROM subjects sub WHERE sub.class_id = c.id) as "subjectCount",
        (SELECT json_agg(json_build_object('id', sub.id, 'name', sub.name, 'teacherId', sub.teacher_id, 'teacherName', tu.name))
         FROM subjects sub LEFT JOIN teachers tsub ON tsub.id = sub.teacher_id LEFT JOIN users tu ON tu.id = tsub.user_id WHERE sub.class_id = c.id) as subjects
      FROM classes c
      LEFT JOIN schools s ON s.id = c.school_id
      LEFT JOIN teachers t ON t.id = c.teacher_id
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY s.name, c.name
    `);
    res.json(rows.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/financial', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const result = await db.execute(sql`
      -- Fee collection summary per school
      SELECT
        s.id as "schoolId", s.name as "schoolName",
        (SELECT COUNT(*) FROM fees f JOIN students st ON st.id = f.student_id WHERE st.school_id = s.id) as "feeRecords",
        (SELECT COALESCE(SUM(f.amount), 0) FROM fees f JOIN students st ON st.id = f.student_id WHERE st.school_id = s.id) as "feeTotal",
        (SELECT COALESCE(SUM(fp.amount), 0) FROM fee_payments fp JOIN students st ON st.id = fp.student_id WHERE st.school_id = s.id) as "collectedAmount",
        (SELECT COUNT(*) FROM payroll_records pr JOIN teachers t ON t.id = pr.teacher_id WHERE t.school_id = s.id) as "payrollRecords",
        (SELECT COALESCE(SUM(pr.net_pay), 0) FROM payroll_records pr JOIN teachers t ON t.id = pr.teacher_id WHERE t.school_id = s.id) as "totalPayroll"
      FROM schools s
      ORDER BY s.name
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/attendance', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const rows = await db.execute(sql`
      SELECT
        a.id, a.student_id, a.subject_id, a.date, a.status,
        u.name as "studentName",
        c.name as "className",
        s.name as "schoolName",
        sub.name as "subjectName"
      FROM attendance a
      JOIN students st ON st.id = a.student_id
      JOIN users u ON u.id = st.user_id
      LEFT JOIN classes c ON c.id = st.class_id
      LEFT JOIN schools s ON s.id = st.school_id
      LEFT JOIN subjects sub ON sub.id = a.subject_id
      ORDER BY a.date DESC
      LIMIT 500
    `);
    res.json(rows.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/timetable', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const rows = await db.execute(sql`
      SELECT
        tt.id, tt.class_id, tt.subject_id, tt.teacher_id, tt.day_of_week, tt.start_time, tt.end_time, tt.room, tt.term,
        c.name as "className",
        s.name as "schoolName",
        sub.name as "subjectName",
        u.name as "teacherName"
      FROM timetable tt
      JOIN classes c ON c.id = tt.class_id
      JOIN subjects sub ON sub.id = tt.subject_id
      JOIN teachers t ON t.id = tt.teacher_id
      JOIN users u ON u.id = t.user_id
      LEFT JOIN schools s ON s.id = c.school_id
      ORDER BY s.name, c.name, tt.day_of_week, tt.start_time
      LIMIT 500
    `);
    res.json(rows.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── CRUD: Schools ──
router.delete('/schools/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'School not found' });
    await db.delete(schools).where(eq(schools.id, id));
    res.json({ message: 'School deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── CRUD: Users ──
router.put('/users/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const { name, email, role, schoolId } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (schoolId !== undefined) updates.schoolId = schoolId === '' ? null : parseInt(schoolId);
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'User not found' });
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.deleteUser(existing.authId).catch(() => {});
    }
    await db.delete(users).where(eq(users.id, id));
    res.json({ message: 'User deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── CRUD: Teachers ──
router.put('/teachers/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const { employeeId, specialization, phone, status, portalAccess, schoolId } = req.body;
    const updates: any = {};
    if (employeeId !== undefined) updates.employeeId = employeeId;
    if (specialization !== undefined) updates.specialization = specialization;
    if (phone !== undefined) updates.phone = phone;
    if (status !== undefined) updates.status = status;
    if (portalAccess !== undefined) updates.portalAccess = portalAccess;
    if (schoolId !== undefined) updates.schoolId = schoolId === '' ? null : parseInt(schoolId);
    const [updated] = await db.update(teachers).set(updates).where(eq(teachers.id, id)).returning();
    if (!updated) return res.status(404).json({ error: 'Teacher not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/teachers/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Teacher not found' });
    await db.delete(teachers).where(eq(teachers.id, id));
    res.json({ message: 'Teacher deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── CRUD: Students ──
router.put('/students/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const { classId, studentId, gender, status, schoolId, guardianName, guardianPhone, guardianEmail, guardianRelationship } = req.body;
    const updates: any = {};
    if (classId !== undefined) updates.classId = parseInt(classId);
    if (studentId !== undefined) updates.studentId = studentId;
    if (gender !== undefined) updates.gender = gender;
    if (status !== undefined) updates.status = status;
    if (schoolId !== undefined) updates.schoolId = schoolId === '' ? null : parseInt(schoolId);
    await db.update(students).set(updates).where(eq(students.id, id));

    if (guardianName !== undefined) {
      const [st] = await db.select().from(students).where(eq(students.id, id)).limit(1);
      if (st?.guardianId) {
        await db.update(guardians).set({
          name: guardianName,
          phone: guardianPhone,
          email: guardianEmail,
          relationship: guardianRelationship,
        }).where(eq(guardians.id, st.guardianId));
      }
    }

    const [updated] = await db.select()
      .from(students)
      .leftJoin(guardians, eq(students.guardianId, guardians.id))
      .where(eq(students.id, id)).limit(1);
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/students/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(students).where(eq(students.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Student not found' });
    await db.delete(students).where(eq(students.id, id));
    res.json({ message: 'Student deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── CRUD: Classes ──
router.post('/classes', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { name, schoolId, teacherId, academicYear } = req.body;
    const [created] = await db.insert(classes).values({
      name, schoolId: parseInt(schoolId), teacherId: teacherId ? parseInt(teacherId) : null, academicYear,
    }).returning();
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/classes/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const { name, schoolId, teacherId, academicYear } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (schoolId !== undefined) updates.schoolId = parseInt(schoolId);
    if (teacherId !== undefined) updates.teacherId = teacherId === '' ? null : parseInt(teacherId);
    if (academicYear !== undefined) updates.academicYear = academicYear;
    const [updated] = await db.update(classes).set(updates).where(eq(classes.id, id)).returning();
    if (!updated) return res.status(404).json({ error: 'Class not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/classes/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Class not found' });
    await db.delete(classes).where(eq(classes.id, id));
    res.json({ message: 'Class deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── CRUD: Subjects ──
router.post('/subjects', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { name, classId, teacherId } = req.body;
    const [created] = await db.insert(subjects).values({
      name, classId: parseInt(classId), teacherId: teacherId ? parseInt(teacherId) : null,
    }).returning();
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/subjects/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const { name, classId, teacherId } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (classId !== undefined) updates.classId = parseInt(classId);
    if (teacherId !== undefined) updates.teacherId = teacherId === '' ? null : parseInt(teacherId);
    const [updated] = await db.update(subjects).set(updates).where(eq(subjects.id, id)).returning();
    if (!updated) return res.status(404).json({ error: 'Subject not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/subjects/:id', authenticate, async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Subject not found' });
    await db.delete(subjects).where(eq(subjects.id, id));
    res.json({ message: 'Subject deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
