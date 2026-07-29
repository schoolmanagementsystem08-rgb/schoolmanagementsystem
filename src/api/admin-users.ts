import { Router } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { role, search } = req.query;
    let query = db.select({
      id: users.id,
      authId: users.authId,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users);

    if (schoolId) query = query.where(eq(users.schoolId, schoolId)) as any;
    if (role && role !== 'all') {
      query = query.where(eq(users.role, role as string)) as any;
    }
    if (search) {
      query = query.where(
        sql`${users.name} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'}`
      ) as any;
    }

    const result = await query.orderBy(users.name);
    res.json(result);
  } catch (error: any) {
    console.error('[Admin Users] Error fetching:', error?.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/:id/role', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const userId = Number(req.params.id);
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const findConditions: any[] = [eq(users.id, userId)];
    if (schoolId) findConditions.push(eq(users.schoolId, schoolId));
    const [existing] = await db.select().from(users).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    await db.update(users).set({ role }).where(and(...findConditions));
    const [updated] = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role,
    }).from(users).where(eq(users.id, userId)).limit(1);

    res.json(updated);
  } catch (error: any) {
    console.error('[Admin Users] Error updating role:', error?.message);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const userId = Number(req.params.id);
    const findConditions: any[] = [eq(users.id, userId)];
    if (schoolId) findConditions.push(eq(users.schoolId, schoolId));
    const [existing] = await db.select({ name: users.name, email: users.email }).from(users).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'User not found' });
    await softDelete('users', userId, { deletedUserName: existing.name, deletedUserEmail: existing.email });
    res.json({ message: 'User deleted. Backup retained for 30 days.' });
  } catch (error: any) {
    console.error('[Admin Users] Error deleting:', error?.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
