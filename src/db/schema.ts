import { pgTable, serial, text, timestamp, integer, boolean, real, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(), // superadmin, admin, teacher, student, parent
  schoolId: integer('school_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const schools = pgTable('schools', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  adminId: integer('admin_id'),
  settings: jsonb('settings'), // JSON object
});

export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  schoolId: integer('school_id').notNull(),
  teacherId: integer('teacher_id'),
  academicYear: text('academic_year').notNull(),
});

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  classId: integer('class_id').notNull(),
  enrollmentDate: timestamp('enrollment_date').defaultNow().notNull(),
  guardianId: integer('guardian_id'),
  status: text('status').default('Active').notNull(),
});

export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  classId: integer('class_id').notNull(),
  teacherId: integer('teacher_id').notNull(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  subjectId: integer('subject_id'),
  date: timestamp('date').notNull(),
  status: text('status').notNull(), // present, absent, late
});

export const grades = pgTable('grades', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  subjectId: integer('subject_id').notNull(),
  score: real('score').notNull(),
  maxScore: real('max_score').notNull(),
  term: text('term').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subjectId: integer('subject_id').notNull(),
  dueDate: timestamp('due_date').notNull(),
  description: text('description'),
  attachmentUrl: text('attachment_url'),
});

export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').notNull(),
  studentId: integer('student_id').notNull(),
  fileUrl: text('file_url').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  grade: real('grade'),
});

export const teachers = pgTable('teachers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  employeeId: text('employee_id'),
  specialization: text('specialization'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  schoolId: integer('school_id').notNull(),
  targetRole: text('target_role'), // e.g., 'student', 'teacher', or null for all
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  date: timestamp('date').notNull(),
  location: text('location'),
  schoolId: integer('school_id').notNull(),
  description: text('description'),
});

export const fees = pgTable('fees', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  amount: real('amount').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: text('status').notNull(), // paid, unpaid, partial
  term: text('term').notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull(),
  receiverId: integer('receiver_id').notNull(),
  body: text('body').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
