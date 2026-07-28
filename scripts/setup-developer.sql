-- ============================================================
-- SETUP DEVELOPER ACCOUNT
-- ============================================================
-- 1. Sign up at https://nexusedu-sms.pages.dev/signup with your
--    email and password via the normal registration page.
-- 2. Then run this SQL in your Supabase SQL Editor
--    (https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new)
--    to elevate your role to 'developer'.
-- ============================================================

-- Replace 'your@email.com' with the email you used to sign up
UPDATE "users"
SET role = 'developer',
    name = 'System Developer'
WHERE email = 'your@email.com';

-- Verify it worked
SELECT id, name, email, role FROM "users" WHERE email = 'your@email.com';

-- If you want to make another user a developer later:
-- UPDATE "users" SET role = 'developer' WHERE email = 'their@email.com';
