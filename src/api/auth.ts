import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { db } from '../db';
import { users, teachers } from '../db/schema';
import { eq } from 'drizzle-orm';

const supabase = createClient(env.SUPABASE_URL || '', env.SUPABASE_ANON_KEY || '');
const router = Router();

router.post('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid token' });

    const { name } = req.body;

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, authUser.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ ...(name && { name }) })
        .where(eq(users.id, existing.id))
        .returning();
      return res.json({ user: updated });
    }

    const role = authUser.user_metadata?.role || 'student';
    const displayName = name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';

    const [created] = await db
      .insert(users)
      .values({
        clerkId: authUser.id,
        name: displayName,
        email: authUser.email || '',
        role,
      })
      .returning();

    if (role === 'teacher') {
      await db.insert(teachers).values({
        userId: created.id,
        specialization: authUser.user_metadata?.specialization || 'General',
      });
    }

    res.status(201).json({ user: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Profile operation failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid token' });

    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, authUser.id))
      .limit(1);

    if (!profile) return res.status(404).json({ error: 'Profile not found. Complete signup first.' });

    let teacherRecord = null;
    if (profile.role === 'teacher') {
      const [t] = await db.select().from(teachers).where(eq(teachers.userId, profile.id)).limit(1);
      teacherRecord = t || null;
    }

    res.json({ user: profile, teacher: teacherRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

export default router;
