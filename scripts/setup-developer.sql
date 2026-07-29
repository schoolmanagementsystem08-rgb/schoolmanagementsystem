-- ============================================================
-- SETUP DEVELOPER ACCOUNT (SQL METHOD)
-- ============================================================
-- Run this SQL in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
--
-- After running, logout and login again for the role to take effect.
-- ============================================================

-- Replace 'your@email.com' with your actual signup email
UPDATE "users"
SET role = 'developer',
    name = 'System Developer'
WHERE email = 'your@email.com';

-- Verify
SELECT id, name, email, role FROM "users" WHERE email = 'your@email.com';
