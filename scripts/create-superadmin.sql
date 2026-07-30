-- ============================================
-- Create Super Admin User (run in Supabase SQL Editor)
-- ============================================
-- Change these values before running:
-- (leave as-is if using the Settings page "Make Me Super Admin" button)
-- ============================================

DO $$
DECLARE
  v_email TEXT := 'superadmin@school.com';      -- ← YOUR SUPER ADMIN EMAIL
  v_password TEXT := 'SuperAdmin123!';           -- ← YOUR SUPER ADMIN PASSWORD
  v_name TEXT := 'System Super Admin';
  v_auth_id UUID;
  v_user_id INTEGER;
BEGIN

  -- 1. Check if auth user exists, create or update
  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email;

  IF v_auth_id IS NULL THEN
    -- Create Supabase Auth user
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', v_name, 'role', 'superadmin'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_auth_id;
  ELSE
    -- Update existing auth user's password
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_auth_id;
  END IF;

  -- 2. Create/update user in public.users
  INSERT INTO public.users (auth_id, name, email, role, school_id, created_at)
  VALUES (v_auth_id, v_name, v_email, 'superadmin', NULL, now())
  ON CONFLICT (auth_id) DO UPDATE SET
    role = 'superadmin',
    name = v_name,
    school_id = NULL;

  -- Get the user ID
  SELECT id INTO v_user_id FROM public.users WHERE auth_id = v_auth_id;

  RAISE NOTICE '✅ Super admin created: ID=%, Email=%', v_user_id, v_email;
END $$;
