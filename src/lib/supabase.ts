import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Supabase client for server-side use
export const supabase = createClient(
  env.SUPABASE_URL || '',
  env.SUPABASE_ANON_KEY || ''
);

// Alternative: Create admin client with service role key for elevated permissions
// Use this only on the server for privileged operations
export const supabaseAdmin = createClient(
  env.SUPABASE_URL || '',
  env.SUPABASE_SERVICE_ROLE_KEY || ''
);
