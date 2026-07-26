-- ============================================
-- Supabase Row Level Security for NexusEdu SMS
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================

-- 1. Helper: get the current user's role from the custom `users` table
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid()::text
$$;

-- 2. Helper: get the current user's custom `users.id`
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()::text
$$;

-- 3. Helper: get a teacher's `teachers.id` from the current user
CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id FROM public.teachers t JOIN public.users u ON t.user_id = u.id WHERE u.auth_id = auth.uid()::text
$$;

-- 4. Helper: get class IDs the current teacher teaches
CREATE OR REPLACE FUNCTION public.current_teacher_class_ids()
RETURNS integer[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(c.id), '{}') FROM public.classes c WHERE c.teacher_id = public.current_teacher_id()
$$;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles       ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS
-- ============================================
DROP POLICY IF EXISTS "users_select"  ON public.users;
DROP POLICY IF EXISTS "users_insert"  ON public.users;
DROP POLICY IF EXISTS "users_update"  ON public.users;
DROP POLICY IF EXISTS "users_delete"  ON public.users;

CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  auth_id = auth.uid()::text                               -- own record
  OR public.current_user_role() = 'admin'              -- any admin
  OR public.current_user_role() = 'superadmin'
);

CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "users_update" ON public.users FOR UPDATE USING (
  auth_id = auth.uid()::text                                -- update own profile
  OR public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "users_delete" ON public.users FOR DELETE USING (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- SCHOOLS
-- ============================================
DROP POLICY IF EXISTS "schools_select" ON public.schools;
DROP POLICY IF EXISTS "schools_all"    ON public.schools;

CREATE POLICY "schools_select" ON public.schools FOR SELECT USING (
  public.current_user_role() IN ('admin', 'superadmin', 'teacher', 'student', 'parent')
);

CREATE POLICY "schools_all" ON public.schools FOR ALL USING (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- CLASSES
-- ============================================
DROP POLICY IF EXISTS "classes_select" ON public.classes;
DROP POLICY IF EXISTS "classes_insert" ON public.classes;
DROP POLICY IF EXISTS "classes_update" ON public.classes;
DROP POLICY IF EXISTS "classes_delete" ON public.classes;

CREATE POLICY "classes_select" ON public.classes FOR SELECT USING (
  teacher_id = public.current_teacher_id()              -- teacher's own classes
  OR public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (                                           -- student's class
    SELECT 1 FROM public.students s
    JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text AND s.class_id = classes.id
  )
);

CREATE POLICY "classes_insert" ON public.classes FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "classes_update" ON public.classes FOR UPDATE USING (
  public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "classes_delete" ON public.classes FOR DELETE USING (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- STUDENTS
-- ============================================
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

CREATE POLICY "students_select" ON public.students FOR SELECT USING (
  user_id = public.current_user_id()                    -- own student record
  OR class_id = ANY(public.current_teacher_class_ids()) -- teacher sees their class students
  OR public.current_user_role() IN ('admin', 'superadmin')
  OR guardian_id = public.current_user_id()             -- parent sees their children
);

CREATE POLICY "students_insert" ON public.students FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "students_update" ON public.students FOR UPDATE USING (
  public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "students_delete" ON public.students FOR DELETE USING (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- TEACHERS
-- ============================================
DROP POLICY IF EXISTS "teachers_select" ON public.teachers;
DROP POLICY IF EXISTS "teachers_insert" ON public.teachers;
DROP POLICY IF EXISTS "teachers_update" ON public.teachers;
DROP POLICY IF EXISTS "teachers_delete" ON public.teachers;

CREATE POLICY "teachers_select" ON public.teachers FOR SELECT USING (
  user_id = public.current_user_id()                    -- own teacher record
  OR public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "teachers_insert" ON public.teachers FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "teachers_update" ON public.teachers FOR UPDATE USING (
  user_id = public.current_user_id()
  OR public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "teachers_delete" ON public.teachers FOR DELETE USING (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- SUBJECTS
-- ============================================
DROP POLICY IF EXISTS "subjects_select" ON public.subjects;
DROP POLICY IF EXISTS "subjects_write"  ON public.subjects;

CREATE POLICY "subjects_select" ON public.subjects FOR SELECT USING (
  teacher_id = public.current_teacher_id()              -- teacher's own subjects
  OR class_id = ANY(public.current_teacher_class_ids()) -- teacher's class subjects
  OR public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (                                           -- student's class subjects
    SELECT 1 FROM public.students s
    JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text AND s.class_id = subjects.class_id
  )
);

CREATE POLICY "subjects_write" ON public.subjects FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- ATTENDANCE
-- ============================================
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_write"  ON public.attendance;

CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (                                           -- teacher sees their class attendance
    SELECT 1 FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.id = attendance.student_id AND c.teacher_id = public.current_teacher_id()
  )
  OR EXISTS (                                           -- student sees own attendance
    SELECT 1 FROM public.students s
    JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text AND s.id = attendance.student_id
  )
);

CREATE POLICY "attendance_write" ON public.attendance FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (                                           -- teacher records attendance for their class
    SELECT 1 FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.id = attendance.student_id AND c.teacher_id = public.current_teacher_id()
  )
);

-- ============================================
-- GRADES
-- ============================================
DROP POLICY IF EXISTS "grades_select" ON public.grades;
DROP POLICY IF EXISTS "grades_write"  ON public.grades;

CREATE POLICY "grades_select" ON public.grades FOR SELECT USING (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (                                           -- teacher sees grades for their class students
    SELECT 1 FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.id = grades.student_id AND c.teacher_id = public.current_teacher_id()
  )
  OR EXISTS (                                           -- student sees own grades
    SELECT 1 FROM public.students s
    JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text AND s.id = grades.student_id
  )
);

CREATE POLICY "grades_write" ON public.grades FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.id = grades.student_id AND c.teacher_id = public.current_teacher_id()
  )
);

-- ============================================
-- ASSIGNMENTS
-- ============================================
DROP POLICY IF EXISTS "assignments_select" ON public.assignments;
DROP POLICY IF EXISTS "assignments_write"  ON public.assignments;

CREATE POLICY "assignments_select" ON public.assignments FOR SELECT USING (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (                                           -- teacher sees their subject assignments
    SELECT 1 FROM public.subjects sub
    WHERE sub.id = assignments.subject_id AND sub.teacher_id = public.current_teacher_id()
  )
  OR EXISTS (                                           -- student sees their class assignments
    SELECT 1 FROM public.subjects sub
    JOIN public.students s ON s.class_id = sub.class_id
    JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text AND sub.id = assignments.subject_id
  )
);

CREATE POLICY "assignments_write" ON public.assignments FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (
    SELECT 1 FROM public.subjects sub
    WHERE sub.id = assignments.subject_id AND sub.teacher_id = public.current_teacher_id()
  )
);

-- ============================================
-- SUBMISSIONS
-- ============================================
DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert" ON public.submissions;
DROP POLICY IF EXISTS "submissions_update" ON public.submissions;

CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (                                           -- teacher sees submissions for their assignments
    SELECT 1 FROM public.assignments a
    JOIN public.subjects sub ON a.subject_id = sub.id
    WHERE sub.teacher_id = public.current_teacher_id() AND a.id = submissions.assignment_id
  )
  OR EXISTS (                                           -- student sees own submissions
    SELECT 1 FROM public.students s
    JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text AND s.id = submissions.student_id
  )
);

CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (
  EXISTS (                                              -- student submits their own work
    SELECT 1 FROM public.students s
    JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text AND s.id = submissions.student_id
  )
);

CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE USING (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.subjects sub ON a.subject_id = sub.id
    WHERE sub.teacher_id = public.current_teacher_id() AND a.id = submissions.assignment_id
  )
);

-- ============================================
-- FEES
-- ============================================
DROP POLICY IF EXISTS "fees_select" ON public.fees;
DROP POLICY IF EXISTS "fees_write"  ON public.fees;

CREATE POLICY "fees_select" ON public.fees FOR SELECT USING (
  public.current_user_role() IN ('admin', 'superadmin')
  OR EXISTS (                                           -- student sees own fees
    SELECT 1 FROM public.students s
    JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()::text AND s.id = fees.student_id
  )
  OR EXISTS (                                           -- parent sees children's fees
    SELECT 1 FROM public.students s
    WHERE s.id = fees.student_id AND s.guardian_id = public.current_user_id()
  )
);

CREATE POLICY "fees_write" ON public.fees FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- ANNOUNCEMENTS
-- ============================================
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
DROP POLICY IF EXISTS "announcements_write"  ON public.announcements;

CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (
  target_role IS NULL                                   -- public to all
  OR target_role = public.current_user_role()           -- targeted to my role
  OR public.current_user_role() IN ('admin', 'superadmin')
);

CREATE POLICY "announcements_write" ON public.announcements FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- EVENTS
-- ============================================
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_write"  ON public.events;

CREATE POLICY "events_select" ON public.events FOR SELECT USING (
  public.current_user_role() IS NOT NULL                -- any authenticated user
);

CREATE POLICY "events_write" ON public.events FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);

-- ============================================
-- MESSAGES
-- ============================================
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  sender_id = public.current_user_id()                  -- sent by me
  OR receiver_id = public.current_user_id()             -- received by me
);

CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  sender_id = public.current_user_id()                  -- can only send as yourself
);

CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (
  receiver_id = public.current_user_id()                -- can mark own received messages as read
);

-- ============================================
-- ROLES
-- ============================================
DROP POLICY IF EXISTS "roles_select" ON public.roles;
DROP POLICY IF EXISTS "roles_write"  ON public.roles;

CREATE POLICY "roles_select" ON public.roles FOR SELECT USING (
  public.current_user_role() IN ('admin', 'superadmin', 'teacher')
);

CREATE POLICY "roles_write" ON public.roles FOR INSERT WITH CHECK (
  public.current_user_role() IN ('admin', 'superadmin')
);
