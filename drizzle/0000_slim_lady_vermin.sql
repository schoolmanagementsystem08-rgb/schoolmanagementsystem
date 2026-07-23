CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"school_id" integer NOT NULL,
	"target_role" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subject_id" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"description" text,
	"attachment_url" text
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"subject_id" integer,
	"date" timestamp NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"school_id" integer NOT NULL,
	"teacher_id" integer,
	"academic_year" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" timestamp NOT NULL,
	"location" text,
	"school_id" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"amount" real NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" text NOT NULL,
	"term" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"score" real NOT NULL,
	"max_score" real NOT NULL,
	"term" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"body" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"admin_id" integer,
	"settings" jsonb
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"enrollment_date" timestamp DEFAULT now() NOT NULL,
	"guardian_id" integer
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class_id" integer NOT NULL,
	"teacher_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"file_url" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"grade" real
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"school_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
