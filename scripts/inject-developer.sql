-- ============================================================
-- SQL INJECTION: Create Developer Account from scratch
-- ============================================================
-- Run in Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
--
-- 1. Edit the email and password below
-- 2. Run the entire script
-- 3. Login with the credentials at https://nexusedu-sms.pages.dev/login
-- ============================================================

-- >>> CONFIG: Change these values <<<
DO $$
DECLARE
  v_email TEXT := 'developer@school.com';     -- ← YOUR EMAIL
  v_password TEXT := 'DevPass123!';           -- ← YOUR PASSWORD
  v_name TEXT := 'System Developer';
  v_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    -- Create the auth user with hashed password
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('name', v_name, 'role', 'developer'),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Auth user created: %', v_user_id;
  ELSE
    -- Update password if user exists
    UPDATE auth.users 
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object('name', v_name, 'role', 'developer'),
        updated_at = now()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Auth user already exists, password updated: %', v_user_id;
  END IF;

  -- Upsert into public.users table
  INSERT INTO public.users (auth_id, name, email, role, created_at)
  VALUES (v_user_id, v_name, v_email, 'developer', now())
  ON CONFLICT (auth_id) DO UPDATE SET role = 'developer', name = v_name;
  
  RAISE NOTICE 'Developer account ready — login with % / %', v_email, v_password;
END $$;

-- Verify
SELECT id, name, email, role FROM public.users WHERE role = 'developer';
