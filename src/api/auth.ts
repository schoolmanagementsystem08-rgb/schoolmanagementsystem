import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { db } from '../db';
import { users, teachers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '../middleware/rateLimit';

const supabase = createClient(env.SUPABASE_URL || '', env.SUPABASE_ANON_KEY || '');
const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.SUPABASE_URL || '', env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
const router = Router();

router.post('/forgot-password', rateLimit(3, 60000), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin || 'https://nexusedu-sms.pages.dev'}/reset-password`,
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Reset link sent' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sign-out-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid token' });
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.signOut(authUser.id);
    }
    res.json({ message: 'Signed out from all devices' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) {
      console.error('[Auth /profile] Invalid token:', error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name } = req.body;

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ ...(name && { name }) })
        .where(eq(users.id, existing.id))
        .returning();
      return res.json({ user: updated });
    }

    const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
    const isFirstUser = !anyUser;
    const role = authUser.user_metadata?.role || (isFirstUser ? 'admin' : 'student');
    const displayName = name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';

    const [created] = await db
      .insert(users)
      .values({
        authId: authUser.id,
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
    console.error('[Auth /profile] Error:', error?.message);
    res.status(500).json({ error: error.message || 'Profile operation failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    console.log('[Auth /me] Request received, auth header present:', !!req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[Auth /me] No Bearer token');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[Auth /me] Verifying token...');
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) {
      console.error('[Auth /me] Token verification failed:', error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.log('[Auth /me] Token verified, supabase user id:', authUser.id);

    console.log('[Auth /me] Looking up user in DB by authId:', authUser.id);
    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);

    if (!profile) {
      console.log('[Auth /me] No profile found for authId:', authUser.id, '— auto-creating...');
      const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
      const isFirstUser = !anyUser;
      const role = authUser.user_metadata?.role || (isFirstUser ? 'admin' : 'student');
      const displayName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
      const [created] = await db.insert(users).values({
        authId: authUser.id,
        name: displayName,
        email: authUser.email || '',
        role,
      }).returning();
      if (role === 'teacher') {
        await db.insert(teachers).values({
          userId: created.id,
          specialization: authUser.user_metadata?.specialization || 'General',
        });
      }
      console.log('[Auth /me] Auto-created profile:', created.id);
      let teacherRecord = null;
      if (role === 'teacher') {
        const [t] = await db.select().from(teachers).where(eq(teachers.userId, created.id)).limit(1);
        teacherRecord = t || null;
      }
      return res.json({ user: created, teacher: teacherRecord });
    }
    console.log('[Auth /me] Found profile:', profile.id, profile.name, profile.role);

    let teacherRecord = null;
    if (profile.role === 'teacher') {
      const [t] = await db.select().from(teachers).where(eq(teachers.userId, profile.id)).limit(1);
      teacherRecord = t || null;
      console.log('[Auth /me] Teacher record:', teacherRecord?.id || 'not found');
    }

    res.json({ user: profile, teacher: teacherRecord });
  } catch (error: any) {
    console.error('[Auth /me] Error:', error?.message);
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

router.post('/make-me-admin', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid token' });
    const [profile] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, profile.id));
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, { user_metadata: { role: 'admin' } });
    }
    const [updated] = await db.select().from(users).where(eq(users.id, profile.id)).limit(1);
    res.json({ user: updated, message: 'You are now an admin. Log out and log back in.' });
  } catch (error: any) {
    console.error('[Auth /make-me-admin] Error:', error?.message);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/make-me-developer', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid token' });
    const [profile] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    await db.update(users).set({ role: 'developer', name: 'System Developer' }).where(eq(users.id, profile.id));
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, { user_metadata: { role: 'developer', name: 'System Developer' } });
    }
    const [updated] = await db.select().from(users).where(eq(users.id, profile.id)).limit(1);
    res.json({ user: updated, message: 'You are now a developer. Log out and log back in to access System Logs.' });
  } catch (error: any) {
    console.error('[Auth /make-me-developer] Error:', error?.message);
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
