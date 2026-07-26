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
        CREATE TABLE IF NOT EXISTS "schools" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "address" text, "admin_id" integer, "settings" jsonb);
        CREATE TABLE IF NOT EXISTS "classes" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "school_id" integer NOT NULL, "teacher_id" integer, "academic_year" text NOT NULL);
        CREATE TABLE IF NOT EXISTS "students" ("id" serial PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "class_id" integer NOT NULL, "student_id" text, "gender" text, "enrollment_date" timestamp DEFAULT now() NOT NULL, "guardian_id" integer, "status" text DEFAULT 'Active' NOT NULL);
        CREATE TABLE IF NOT EXISTS "guardians" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "phone" text, "email" text, "address" text, "relationship" text, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "teachers" ("id" serial PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "employee_id" text, "specialization" text, "phone" text, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "subjects" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "class_id" integer NOT NULL, "teacher_id" integer NOT NULL);
        CREATE TABLE IF NOT EXISTS "attendance" ("id" serial PRIMARY KEY NOT NULL, "student_id" integer NOT NULL, "subject_id" integer, "date" timestamp NOT NULL, "status" text NOT NULL);
        CREATE TABLE IF NOT EXISTS "grades" ("id" serial PRIMARY KEY NOT NULL, "student_id" integer NOT NULL, "subject_id" integer NOT NULL, "score" real NOT NULL, "max_score" real NOT NULL, "term" text NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "assignments" ("id" serial PRIMARY KEY NOT NULL, "title" text NOT NULL, "subject_id" integer NOT NULL, "due_date" timestamp NOT NULL, "description" text, "attachment_url" text);
        CREATE TABLE IF NOT EXISTS "submissions" ("id" serial PRIMARY KEY NOT NULL, "assignment_id" integer NOT NULL, "student_id" integer NOT NULL, "file_url" text NOT NULL, "submitted_at" timestamp DEFAULT now() NOT NULL, "grade" real);
        CREATE TABLE IF NOT EXISTS "announcements" ("id" serial PRIMARY KEY NOT NULL, "title" text NOT NULL, "body" text NOT NULL, "school_id" integer NOT NULL, "target_role" text, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "events" ("id" serial PRIMARY KEY NOT NULL, "title" text NOT NULL, "date" timestamp NOT NULL, "location" text, "school_id" integer NOT NULL, "description" text);
        CREATE TABLE IF NOT EXISTS "fees" ("id" serial PRIMARY KEY NOT NULL, "student_id" integer NOT NULL, "amount" real NOT NULL, "due_date" timestamp NOT NULL, "status" text NOT NULL, "term" text NOT NULL);
        CREATE TABLE IF NOT EXISTS "messages" ("id" serial PRIMARY KEY NOT NULL, "sender_id" integer NOT NULL, "receiver_id" integer NOT NULL, "body" text NOT NULL, "read" boolean DEFAULT false, "created_at" timestamp DEFAULT now() NOT NULL);
        CREATE TABLE IF NOT EXISTS "roles" ("id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL UNIQUE, "description" text, "permissions" jsonb DEFAULT '{}' NOT NULL, "is_system" boolean DEFAULT false NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL);
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
