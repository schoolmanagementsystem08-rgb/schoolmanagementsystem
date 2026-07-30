import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" serial PRIMARY KEY NOT NULL,
          "auth_id" uuid NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "role" text NOT NULL,
          "school_id" integer,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS "schools" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "slug" text UNIQUE, "domain" text, "address" text, "logo" text, "admin_id" integer, "status" text DEFAULT 'active' NOT NULL, "settings" jsonb, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "classes" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "school_id" integer NOT NULL, "teacher_id" integer, "academic_year" text NOT NULL);
        CREATE TABLE IF NOT EXISTS "students" ("id" serial PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "class_id" integer NOT NULL, "student_id" text, "gender" text, "enrollment_date" timestamp DEFAULT now() NOT NULL, "guardian_id" integer, "status" text DEFAULT 'Active' NOT NULL);
        CREATE TABLE IF NOT EXISTS "guardians" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "phone" text, "email" text, "address" text, "relationship" text, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "teachers" ("id" serial PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "employee_id" text, "specialization" text, "phone" text, "status" text DEFAULT 'Active' NOT NULL, "portal_access" text DEFAULT 'full' NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "qualifications" ("id" serial PRIMARY KEY NOT NULL, "teacher_id" integer NOT NULL, "degree" text NOT NULL, "institution" text NOT NULL, "field" text, "year" text, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "leave_requests" ("id" serial PRIMARY KEY NOT NULL, "teacher_id" integer NOT NULL, "type" text NOT NULL, "reason" text NOT NULL, "start_date" timestamp NOT NULL, "end_date" timestamp NOT NULL, "status" text DEFAULT 'Pending' NOT NULL, "admin_note" text, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "subjects" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "class_id" integer NOT NULL, "teacher_id" integer);
        CREATE TABLE IF NOT EXISTS "attendance" ("id" serial PRIMARY KEY NOT NULL, "student_id" integer NOT NULL, "subject_id" integer, "date" timestamp NOT NULL, "status" text NOT NULL);
        CREATE TABLE IF NOT EXISTS "grades" ("id" serial PRIMARY KEY NOT NULL, "student_id" integer NOT NULL, "subject_id" integer NOT NULL, "score" real NOT NULL, "max_score" real NOT NULL, "term" text NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "assignments" ("id" serial PRIMARY KEY NOT NULL, "title" text NOT NULL, "subject_id" integer NOT NULL, "due_date" timestamp NOT NULL, "description" text, "attachment_url" text);
        CREATE TABLE IF NOT EXISTS "submissions" ("id" serial PRIMARY KEY NOT NULL, "assignment_id" integer NOT NULL, "student_id" integer NOT NULL, "file_url" text NOT NULL, "submitted_at" timestamp DEFAULT now() NOT NULL, "grade" real);
        CREATE TABLE IF NOT EXISTS "announcements" ("id" serial PRIMARY KEY NOT NULL, "title" text NOT NULL, "body" text NOT NULL, "school_id" integer NOT NULL, "target_role" text, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "events" ("id" serial PRIMARY KEY NOT NULL, "title" text NOT NULL, "date" timestamp NOT NULL, "location" text, "school_id" integer NOT NULL, "description" text);
        CREATE TABLE IF NOT EXISTS "fees" ("id" serial PRIMARY KEY NOT NULL, "student_id" integer NOT NULL, "amount" real NOT NULL, "due_date" timestamp NOT NULL, "status" text NOT NULL, "term" text NOT NULL);
CREATE TABLE IF NOT EXISTS "fee_structures" ("id" serial PRIMARY KEY NOT NULL, "class_id" integer NOT NULL, "academic_year" text NOT NULL, "term" text NOT NULL, "total_amount" real NOT NULL, "description" text, "due_date" timestamp, "created_at" timestamp DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS "fee_payments" ("id" serial PRIMARY KEY NOT NULL, "student_id" integer NOT NULL, "structure_id" integer NOT NULL, "amount" real NOT NULL, "payment_date" timestamp DEFAULT now() NOT NULL, "payment_method" text, "reference_no" text, "notes" text, "recorded_by" integer, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "messages" ("id" serial PRIMARY KEY NOT NULL, "sender_id" integer NOT NULL, "receiver_id" integer NOT NULL, "body" text NOT NULL, "read" boolean DEFAULT false, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "roles" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL UNIQUE, "description" text, "permissions" jsonb DEFAULT '{}' NOT NULL, "is_system" boolean DEFAULT false NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS "deleted_records" ("id" serial PRIMARY KEY NOT NULL, "table_name" text NOT NULL, "record_id" integer NOT NULL, "data" jsonb NOT NULL, "deleted_at" timestamp DEFAULT now() NOT NULL, "purge_at" timestamp NOT NULL);
CREATE TABLE IF NOT EXISTS "timetable" ("id" serial PRIMARY KEY NOT NULL, "class_id" integer NOT NULL, "subject_id" integer NOT NULL, "teacher_id" integer NOT NULL, "day_of_week" integer NOT NULL, "start_time" text NOT NULL, "end_time" text NOT NULL, "room" text, "term" text, "created_at" timestamp DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS "teacher_salaries" ("id" serial PRIMARY KEY NOT NULL, "teacher_id" integer NOT NULL, "basic_salary" real NOT NULL, "housing_allowance" real DEFAULT 0 NOT NULL, "transport_allowance" real DEFAULT 0 NOT NULL, "medical_allowance" real DEFAULT 0 NOT NULL, "other_allowance" real DEFAULT 0 NOT NULL, "tax_deduction" real DEFAULT 0 NOT NULL, "insurance_deduction" real DEFAULT 0 NOT NULL, "other_deduction" real DEFAULT 0 NOT NULL, "effective_date" timestamp NOT NULL, "status" text DEFAULT 'Active' NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS "payroll_records" ("id" serial PRIMARY KEY NOT NULL, "teacher_id" integer NOT NULL, "period" text NOT NULL, "basic_salary" real NOT NULL, "housing_allowance" real DEFAULT 0 NOT NULL, "transport_allowance" real DEFAULT 0 NOT NULL, "medical_allowance" real DEFAULT 0 NOT NULL, "other_allowance" real DEFAULT 0 NOT NULL, "bonus" real DEFAULT 0 NOT NULL, "tax_deduction" real DEFAULT 0 NOT NULL, "insurance_deduction" real DEFAULT 0 NOT NULL, "other_deduction" real DEFAULT 0 NOT NULL, "net_pay" real NOT NULL, "payment_date" timestamp, "status" text DEFAULT 'Draft' NOT NULL, "notes" text, "created_at" timestamp DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS "scholarships" ("id" serial PRIMARY KEY NOT NULL, "student_id" integer NOT NULL, "scholarship_name" text NOT NULL, "type" text NOT NULL, "discount_percentage" real NOT NULL, "amount" real, "start_date" timestamp NOT NULL, "end_date" timestamp, "status" text DEFAULT 'Active' NOT NULL, "notes" text, "approved_by" integer, "created_at" timestamp DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS "activity_logs" ("id" serial PRIMARY KEY NOT NULL, "user_id" integer, "user_name" text, "user_role" text, "action" text NOT NULL, "entity" text, "entity_id" integer, "details" jsonb, "ip_address" text, "user_agent" text, "path" text, "method" text, "timestamp" timestamp DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS "error_logs" ("id" serial PRIMARY KEY NOT NULL, "user_id" integer, "user_name" text, "level" text DEFAULT 'error' NOT NULL, "message" text NOT NULL, "stack" text, "context" jsonb, "ip_address" text, "url" text, "timestamp" timestamp DEFAULT now() NOT NULL);

CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees (student_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_term ON fee_structures (class_id, academic_year, term);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments (student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_structure ON fee_payments (structure_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students (class_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students (user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers (user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class_id ON timetable (class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_id ON timetable (teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day_of_week ON timetable (day_of_week);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects (teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades (student_id);
CREATE INDEX IF NOT EXISTS idx_scholarships_student_id ON scholarships (student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_teacher ON teacher_salaries (teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_teacher ON payroll_records (teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records (period);
      `);

      await client.query(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='clerk_id') THEN
            ALTER TABLE "users" RENAME COLUMN "clerk_id" TO "auth_id";
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='student_id') THEN
            ALTER TABLE "students" ADD COLUMN "student_id" text;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='gender') THEN
            ALTER TABLE "students" ADD COLUMN "gender" text;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='status') THEN
            ALTER TABLE "teachers" ADD COLUMN "status" text DEFAULT 'Active';
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='portal_access') THEN
            ALTER TABLE "teachers" ADD COLUMN "portal_access" text DEFAULT 'full';
          END IF;
        END $$;
      `);

      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='slug') THEN
            ALTER TABLE "schools" ADD COLUMN "slug" text;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='domain') THEN
            ALTER TABLE "schools" ADD COLUMN "domain" text;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='logo') THEN
            ALTER TABLE "schools" ADD COLUMN "logo" text;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='status') THEN
            ALTER TABLE "schools" ADD COLUMN "status" text DEFAULT 'active';
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='created_at') THEN
            ALTER TABLE "schools" ADD COLUMN "created_at" timestamp DEFAULT now();
          END IF;
        END $$;

        -- Add school_id columns to tables that need direct school filtering
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='school_id') THEN
            ALTER TABLE "students" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='school_id') THEN
            ALTER TABLE "teachers" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guardians' AND column_name='school_id') THEN
            ALTER TABLE "guardians" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='school_id') THEN
            ALTER TABLE "subjects" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='school_id') THEN
            ALTER TABLE "attendance" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grades' AND column_name='school_id') THEN
            ALTER TABLE "grades" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='school_id') THEN
            ALTER TABLE "assignments" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fees' AND column_name='school_id') THEN
            ALTER TABLE "fees" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_structures' AND column_name='school_id') THEN
            ALTER TABLE "fee_structures" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_payments' AND column_name='school_id') THEN
            ALTER TABLE "fee_payments" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='timetable' AND column_name='school_id') THEN
            ALTER TABLE "timetable" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scholarships' AND column_name='school_id') THEN
            ALTER TABLE "scholarships" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_salaries' AND column_name='school_id') THEN
            ALTER TABLE "teacher_salaries" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payroll_records' AND column_name='school_id') THEN
            ALTER TABLE "payroll_records" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_logs' AND column_name='school_id') THEN
            ALTER TABLE "activity_logs" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='error_logs' AND column_name='school_id') THEN
            ALTER TABLE "error_logs" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='school_id') THEN
            ALTER TABLE "leave_requests" ADD COLUMN "school_id" integer;
          END IF;
        END $$;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='qualifications' AND column_name='school_id') THEN
            ALTER TABLE "qualifications" ADD COLUMN "school_id" integer;
          END IF;
        END $$;

        -- Indexes for school_id columns
        CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools (slug);
        CREATE INDEX IF NOT EXISTS idx_schools_domain ON schools (domain);
        CREATE INDEX IF NOT EXISTS idx_users_school_id ON users (school_id);
        CREATE INDEX IF NOT EXISTS idx_students_school_id ON students (school_id);
        CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers (school_id);
      `);

      await client.query(`
        -- Convert auth_id from text to uuid if it's still text type
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='auth_id' AND data_type='text') THEN
            -- Replace any non-UUID values with generated UUIDs
            UPDATE "users" SET "auth_id" = gen_random_uuid()::text WHERE "auth_id" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            ALTER TABLE "users" ALTER COLUMN "auth_id" TYPE uuid USING "auth_id"::uuid;
          END IF;
        END $$;
      `);

      await client.query(`
        -- Ensure unique constraint exists
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_auth_id_unique') THEN
            ALTER TABLE "users" ADD CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id");
          END IF;
        END $$;
      `);

      await client.query(`
        -- Row-Level Security: enable on all tables
        ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "schools" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "classes" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "students" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "guardians" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "teachers" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "qualifications" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "subjects" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "attendance" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "grades" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "assignments" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "submissions" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "announcements" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "events" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "fees" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "messages" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "roles" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "leave_requests" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "timetable" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "deleted_records" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS "scholarships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "error_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "fee_structures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "fee_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "teacher_salaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "payroll_records" ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies to make this idempotent
        DROP POLICY IF EXISTS "users_select_policy" ON "users";
        DROP POLICY IF EXISTS "users_insert_policy" ON "users";
        DROP POLICY IF EXISTS "users_update_policy" ON "users";
        DROP POLICY IF EXISTS "users_delete_policy" ON "users";

        DROP POLICY IF EXISTS "schools_select_policy" ON "schools";
        DROP POLICY IF EXISTS "schools_insert_policy" ON "schools";
        DROP POLICY IF EXISTS "schools_update_policy" ON "schools";

        DROP POLICY IF EXISTS "classes_select_policy" ON "classes";
        DROP POLICY IF EXISTS "classes_insert_policy" ON "classes";
        DROP POLICY IF EXISTS "classes_update_policy" ON "classes";
        DROP POLICY IF EXISTS "classes_delete_policy" ON "classes";

        DROP POLICY IF EXISTS "students_select_policy" ON "students";
        DROP POLICY IF EXISTS "students_insert_policy" ON "students";
        DROP POLICY IF EXISTS "students_update_policy" ON "students";
        DROP POLICY IF EXISTS "students_delete_policy" ON "students";

        DROP POLICY IF EXISTS "guardians_select_policy" ON "guardians";
        DROP POLICY IF EXISTS "guardians_insert_policy" ON "guardians";
        DROP POLICY IF EXISTS "guardians_update_policy" ON "guardians";

        DROP POLICY IF EXISTS "teachers_select_policy" ON "teachers";
        DROP POLICY IF EXISTS "teachers_insert_policy" ON "teachers";
        DROP POLICY IF EXISTS "teachers_update_policy" ON "teachers";
        DROP POLICY IF EXISTS "teachers_delete_policy" ON "teachers";

        DROP POLICY IF EXISTS "subjects_select_policy" ON "subjects";
        DROP POLICY IF EXISTS "subjects_insert_policy" ON "subjects";
        DROP POLICY IF EXISTS "subjects_update_policy" ON "subjects";
        DROP POLICY IF EXISTS "subjects_delete_policy" ON "subjects";

        DROP POLICY IF EXISTS "attendance_select_policy" ON "attendance";
        DROP POLICY IF EXISTS "attendance_insert_policy" ON "attendance";
        DROP POLICY IF EXISTS "attendance_update_policy" ON "attendance";
        DROP POLICY IF EXISTS "attendance_delete_policy" ON "attendance";

        DROP POLICY IF EXISTS "grades_select_policy" ON "grades";
        DROP POLICY IF EXISTS "grades_insert_policy" ON "grades";
        DROP POLICY IF EXISTS "grades_update_policy" ON "grades";
        DROP POLICY IF EXISTS "grades_delete_policy" ON "grades";

        DROP POLICY IF EXISTS "fees_select_policy" ON "fees";
        DROP POLICY IF EXISTS "fees_insert_policy" ON "fees";
        DROP POLICY IF EXISTS "fees_update_policy" ON "fees";
        DROP POLICY IF EXISTS "fees_delete_policy" ON "fees";

        DROP POLICY IF EXISTS "announcements_select_policy" ON "announcements";
        DROP POLICY IF EXISTS "announcements_insert_policy" ON "announcements";
        DROP POLICY IF EXISTS "announcements_update_policy" ON "announcements";
        DROP POLICY IF EXISTS "announcements_delete_policy" ON "announcements";

        DROP POLICY IF EXISTS "messages_select_policy" ON "messages";
        DROP POLICY IF EXISTS "messages_insert_policy" ON "messages";
        DROP POLICY IF EXISTS "messages_update_policy" ON "messages";
        DROP POLICY IF EXISTS "messages_delete_policy" ON "messages";

        DROP POLICY IF EXISTS "roles_select_policy" ON "roles";
        DROP POLICY IF EXISTS "roles_insert_policy" ON "roles";
        DROP POLICY IF EXISTS "roles_update_policy" ON "roles";
        DROP POLICY IF EXISTS "roles_delete_policy" ON "roles";

        DROP POLICY IF EXISTS "leave_requests_select_policy" ON "leave_requests";
        DROP POLICY IF EXISTS "leave_requests_insert_policy" ON "leave_requests";
        DROP POLICY IF EXISTS "leave_requests_update_policy" ON "leave_requests";
        DROP POLICY IF EXISTS "leave_requests_delete_policy" ON "leave_requests";

        DROP POLICY IF EXISTS "timetable_select_policy" ON "timetable";
        DROP POLICY IF EXISTS "timetable_insert_policy" ON "timetable";
        DROP POLICY IF EXISTS "timetable_update_policy" ON "timetable";
        DROP POLICY IF EXISTS "timetable_delete_policy" ON "timetable";

        DROP POLICY IF EXISTS "scholarships_select_policy" ON "scholarships";
        DROP POLICY IF EXISTS "scholarships_insert_policy" ON "scholarships";
        DROP POLICY IF EXISTS "scholarships_update_policy" ON "scholarships";
        DROP POLICY IF EXISTS "scholarships_delete_policy" ON "scholarships";

        -- Create policies: admins have full access, teachers read their related data, students/parents read own
        CREATE POLICY "users_select_policy" ON "users" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR auth_id::text = current_setting('app.user_id', true)
          OR current_setting('app.role', true) = 'teacher'
        );
        CREATE POLICY "users_insert_policy" ON "users" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "users_update_policy" ON "users" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "users_delete_policy" ON "users" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "schools_select_policy" ON "schools" FOR SELECT USING (true);
        CREATE POLICY "schools_insert_policy" ON "schools" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "schools_update_policy" ON "schools" FOR UPDATE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "classes_select_policy" ON "classes" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)) AND teachers.id = classes.teacher_id)
        );
        CREATE POLICY "classes_insert_policy" ON "classes" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "classes_update_policy" ON "classes" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "classes_delete_policy" ON "classes" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "students_select_policy" ON "students" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)) AND teachers.id = (SELECT teacher_id FROM classes WHERE classes.id = students.class_id))
          OR students.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))
        );
        CREATE POLICY "students_insert_policy" ON "students" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "students_update_policy" ON "students" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "students_delete_policy" ON "students" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "guardians_select_policy" ON "guardians" FOR SELECT USING (current_setting('app.role', true) IN ('admin', 'teacher'));
        CREATE POLICY "guardians_insert_policy" ON "guardians" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "guardians_update_policy" ON "guardians" FOR UPDATE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "teachers_select_policy" ON "teachers" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))
        );
        CREATE POLICY "teachers_insert_policy" ON "teachers" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "teachers_update_policy" ON "teachers" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "teachers_delete_policy" ON "teachers" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "subjects_select_policy" ON "subjects" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR subjects.teacher_id IN (SELECT teachers.id FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)))
        );
        CREATE POLICY "subjects_insert_policy" ON "subjects" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "subjects_update_policy" ON "subjects" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "subjects_delete_policy" ON "subjects" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "attendance_select_policy" ON "attendance" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR EXISTS (SELECT 1 FROM students WHERE students.id = attendance.student_id AND students.class_id IN (SELECT classes.id FROM classes WHERE classes.teacher_id IN (SELECT teachers.id FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)))))
          OR attendance.student_id IN (SELECT students.id FROM students WHERE students.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)))
        );
        CREATE POLICY "attendance_insert_policy" ON "attendance" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "attendance_update_policy" ON "attendance" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "attendance_delete_policy" ON "attendance" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "grades_select_policy" ON "grades" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR EXISTS (SELECT 1 FROM subjects WHERE subjects.id = grades.subject_id AND subjects.teacher_id IN (SELECT teachers.id FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))))
          OR grades.student_id IN (SELECT students.id FROM students WHERE students.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)))
        );
        CREATE POLICY "grades_insert_policy" ON "grades" FOR INSERT WITH CHECK (current_setting('app.role', true) IN ('admin', 'teacher'));
        CREATE POLICY "grades_update_policy" ON "grades" FOR UPDATE USING (current_setting('app.role', true) IN ('admin', 'teacher'));
        CREATE POLICY "grades_delete_policy" ON "grades" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "fees_select_policy" ON "fees" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR fees.student_id IN (SELECT students.id FROM students WHERE students.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)))
        );
        CREATE POLICY "fees_insert_policy" ON "fees" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "fees_update_policy" ON "fees" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "fees_delete_policy" ON "fees" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "announcements_select_policy" ON "announcements" FOR SELECT USING (true);
        CREATE POLICY "announcements_insert_policy" ON "announcements" FOR INSERT WITH CHECK (current_setting('app.role', true) IN ('admin', 'teacher'));
        CREATE POLICY "announcements_update_policy" ON "announcements" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "announcements_delete_policy" ON "announcements" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "messages_select_policy" ON "messages" FOR SELECT USING (
          messages.sender_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))
          OR messages.receiver_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))
        );
        CREATE POLICY "messages_insert_policy" ON "messages" FOR INSERT WITH CHECK (
          messages.sender_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))
        );
        CREATE POLICY "messages_update_policy" ON "messages" FOR UPDATE USING (
          messages.receiver_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))
        );
        CREATE POLICY "messages_delete_policy" ON "messages" FOR DELETE USING (
          messages.sender_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))
          OR messages.receiver_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true))
        );

        CREATE POLICY "roles_select_policy" ON "roles" FOR SELECT USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "roles_insert_policy" ON "roles" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "roles_update_policy" ON "roles" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "roles_delete_policy" ON "roles" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "leave_requests_select_policy" ON "leave_requests" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR leave_requests.teacher_id IN (SELECT teachers.id FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)))
        );
        CREATE POLICY "leave_requests_insert_policy" ON "leave_requests" FOR INSERT WITH CHECK (
          leave_requests.teacher_id IN (SELECT teachers.id FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)))
        );
        CREATE POLICY "leave_requests_update_policy" ON "leave_requests" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "leave_requests_delete_policy" ON "leave_requests" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "timetable_select_policy" ON "timetable" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)) AND teachers.id = timetable.teacher_id)
        );
        CREATE POLICY "timetable_insert_policy" ON "timetable" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "timetable_update_policy" ON "timetable" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "timetable_delete_policy" ON "timetable" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        CREATE POLICY "scholarships_select_policy" ON "scholarships" FOR SELECT USING (
          current_setting('app.role', true) = 'admin'
          OR EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = (SELECT id FROM users WHERE auth_id::text = current_setting('app.user_id', true)))
        );
        CREATE POLICY "scholarships_insert_policy" ON "scholarships" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "scholarships_update_policy" ON "scholarships" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "scholarships_delete_policy" ON "scholarships" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        DROP POLICY IF EXISTS "activity_logs_select_policy" ON "activity_logs";
        DROP POLICY IF EXISTS "activity_logs_insert_policy" ON "activity_logs";
        DROP POLICY IF EXISTS "error_logs_select_policy" ON "error_logs";
        DROP POLICY IF EXISTS "error_logs_insert_policy" ON "error_logs";

        CREATE POLICY "activity_logs_select_policy" ON "activity_logs" FOR SELECT USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "activity_logs_insert_policy" ON "activity_logs" FOR INSERT WITH CHECK (true);
        CREATE POLICY "error_logs_select_policy" ON "error_logs" FOR SELECT USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "error_logs_insert_policy" ON "error_logs" FOR INSERT WITH CHECK (true);

        DROP POLICY IF EXISTS "fee_structures_select_policy" ON "fee_structures";
        DROP POLICY IF EXISTS "fee_structures_insert_policy" ON "fee_structures";
        DROP POLICY IF EXISTS "fee_structures_update_policy" ON "fee_structures";
        DROP POLICY IF EXISTS "fee_structures_delete_policy" ON "fee_structures";
        DROP POLICY IF EXISTS "fee_payments_select_policy" ON "fee_payments";
        DROP POLICY IF EXISTS "fee_payments_insert_policy" ON "fee_payments";
        DROP POLICY IF EXISTS "fee_payments_update_policy" ON "fee_payments";
        DROP POLICY IF EXISTS "fee_payments_delete_policy" ON "fee_payments";

        CREATE POLICY "fee_structures_select_policy" ON "fee_structures" FOR SELECT USING (true);
        CREATE POLICY "fee_structures_insert_policy" ON "fee_structures" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "fee_structures_update_policy" ON "fee_structures" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "fee_structures_delete_policy" ON "fee_structures" FOR DELETE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "fee_payments_select_policy" ON "fee_payments" FOR SELECT USING (true);
        CREATE POLICY "fee_payments_insert_policy" ON "fee_payments" FOR INSERT WITH CHECK (current_setting('app.role', true) IN ('admin', 'teacher'));
        CREATE POLICY "fee_payments_update_policy" ON "fee_payments" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "fee_payments_delete_policy" ON "fee_payments" FOR DELETE USING (current_setting('app.role', true) = 'admin');

        DROP POLICY IF EXISTS "teacher_salaries_select_policy" ON "teacher_salaries";
        DROP POLICY IF EXISTS "teacher_salaries_insert_policy" ON "teacher_salaries";
        DROP POLICY IF EXISTS "teacher_salaries_update_policy" ON "teacher_salaries";
        DROP POLICY IF EXISTS "teacher_salaries_delete_policy" ON "teacher_salaries";
        DROP POLICY IF EXISTS "payroll_records_select_policy" ON "payroll_records";
        DROP POLICY IF EXISTS "payroll_records_insert_policy" ON "payroll_records";
        DROP POLICY IF EXISTS "payroll_records_update_policy" ON "payroll_records";
        DROP POLICY IF EXISTS "payroll_records_delete_policy" ON "payroll_records";

        CREATE POLICY "teacher_salaries_select_policy" ON "teacher_salaries" FOR SELECT USING (true);
        CREATE POLICY "teacher_salaries_insert_policy" ON "teacher_salaries" FOR INSERT WITH CHECK (current_setting('app.role', true) = 'admin');
        CREATE POLICY "teacher_salaries_update_policy" ON "teacher_salaries" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "teacher_salaries_delete_policy" ON "teacher_salaries" FOR DELETE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "payroll_records_select_policy" ON "payroll_records" FOR SELECT USING (true);
        CREATE POLICY "payroll_records_insert_policy" ON "payroll_records" FOR INSERT WITH CHECK (current_setting('app.role', true) IN ('admin', 'teacher'));
        CREATE POLICY "payroll_records_update_policy" ON "payroll_records" FOR UPDATE USING (current_setting('app.role', true) = 'admin');
        CREATE POLICY "payroll_records_delete_policy" ON "payroll_records" FOR DELETE USING (current_setting('app.role', true) = 'admin');
      `);

      console.log('✅ Database tables ready');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

export async function closeDatabase() {
  await pool.end();
  console.log('✅ Database connection closed');
}
