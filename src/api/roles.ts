import { Router } from 'express';
import { db } from '../db';
import { roles, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';

const router = Router();

const defaultPermissions: Record<string, string[]> = {
  admin: ['*'],
  teacher: [
    'classes:view', 'subjects:view', 'students:view',
    'attendance:create', 'attendance:view', 'attendance:edit',
    'grades:create', 'grades:view', 'grades:edit',
  ],
  student: [
    'grades:view', 'attendance:view', 'announcements:view', 'messages:send',
  ],
  parent: [
    'grades:view', 'attendance:view', 'announcements:view', 'messages:send',
    'fees:view',
  ],
};

router.get('/', async (req, res) => {
  try {
    const allRoles = await db.select().from(roles).orderBy(roles.name);
    const userCounts = await db
      .select({ role: users.role, count: sql<number>`count(*)` })
      .from(users)
      .groupBy(users.role);
    const countMap: Record<string, number> = {};
    for (const row of userCounts) {
      countMap[row.role] = Number(row.count);
    }
    const result = allRoles.map(r => ({
      ...r,
      userCount: countMap[r.name] || 0,
    }));
    res.json(result);
  } catch (error: any) {
    console.error('[Roles] Error fetching:', error?.message);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required' });
    const [existing] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    if (existing) return res.status(409).json({ error: 'Role already exists' });
    const [created] = await db.insert(roles).values({
      name,
      description: description || '',
      permissions: permissions || defaultPermissions[name] || [],
    }).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error('[Roles] Error creating:', error?.message);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const [existing] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Role not found' });
    const { name, description, permissions } = req.body;
    await db.update(roles).set({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(permissions !== undefined && { permissions }),
    }).where(eq(roles.id, roleId));
    const [updated] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    res.json(updated);
  } catch (error: any) {
    console.error('[Roles] Error updating:', error?.message);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const [existing] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Role not found' });
    if (existing.isSystem) return res.status(403).json({ error: 'Cannot delete system role' });
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, existing.name));
    const userCount = Number(row.count);
    if (userCount > 0) return res.status(400).json({ error: `Cannot delete role: ${userCount} user(s) still have this role` });
    await softDelete('roles', roleId, { roleName: existing.name });
    res.json({ message: 'Role deleted. Backup retained for 30 days.' });
  } catch (error: any) {
    console.error('[Roles] Error deleting:', error?.message);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

export default router;
