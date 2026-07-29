import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const supabase = createClient(env.SUPABASE_URL || '', env.SUPABASE_ANON_KEY || '');

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    (req as any).user = {
      id: profile.id,
      authId: profile.authId,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      schoolId: profile.schoolId,
    };

    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Error:', error?.message);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
