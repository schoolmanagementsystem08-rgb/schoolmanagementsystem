import { Router } from 'express';
import { db } from '../db';
import { timetable, classes, subjects, teachers, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { classId, teacherId, dayOfWeek } = req.query;
    const filters: any[] = [];
    if (classId) filters.push(eq(timetable.classId, Number(classId)));
    if (teacherId) filters.push(eq(timetable.teacherId, Number(teacherId)));
    if (dayOfWeek) filters.push(eq(timetable.dayOfWeek, Number(dayOfWeek)));

    const rows = await db
      .select({
        id: timetable.id,
        classId: timetable.classId,
        className: classes.name,
        subjectId: timetable.subjectId,
        subjectName: subjects.name,
        teacherId: timetable.teacherId,
        teacherName: users.name,
        dayOfWeek: timetable.dayOfWeek,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        room: timetable.room,
        term: timetable.term,
        createdAt: timetable.createdAt,
      })
      .from(timetable)
      .leftJoin(classes, eq(timetable.classId, classes.id))
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .leftJoin(teachers, eq(timetable.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(timetable.dayOfWeek, timetable.startTime);

    res.json(rows);
  } catch (error: any) {
    console.error('[Timetable] Error listing:', error?.message);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

router.get('/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const rows = await db
      .select({
        id: timetable.id,
        classId: timetable.classId,
        className: classes.name,
        subjectId: timetable.subjectId,
        subjectName: subjects.name,
        teacherId: timetable.teacherId,
        teacherName: users.name,
        dayOfWeek: timetable.dayOfWeek,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        room: timetable.room,
        term: timetable.term,
      })
      .from(timetable)
      .leftJoin(classes, eq(timetable.classId, classes.id))
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .leftJoin(teachers, eq(timetable.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(timetable.classId, Number(classId)))
      .orderBy(timetable.dayOfWeek, timetable.startTime);
    res.json(rows);
  } catch (error: any) {
    console.error('[Timetable] Error fetching class timetable:', error?.message);
    res.status(500).json({ error: 'Failed to fetch class timetable' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, term } = req.body;
    if (classId == null || subjectId == null || teacherId == null || dayOfWeek == null || !startTime || !endTime) {
      return res.status(400).json({ error: 'classId, subjectId, teacherId, dayOfWeek, startTime, endTime are required' });
    }
    const [created] = await db.insert(timetable).values({ classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, term }).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error('[Timetable] Error creating:', error?.message);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, term } = req.body;
    const [existing] = await db.select().from(timetable).where(eq(timetable.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    await db.update(timetable).set({
      ...(classId != null && { classId }),
      ...(subjectId != null && { subjectId }),
      ...(teacherId != null && { teacherId }),
      ...(dayOfWeek != null && { dayOfWeek }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(room !== undefined && { room }),
      ...(term !== undefined && { term }),
    }).where(eq(timetable.id, Number(id)));

    const [updated] = await db
      .select({
        id: timetable.id, classId: timetable.classId, className: classes.name,
        subjectId: timetable.subjectId, subjectName: subjects.name,
        teacherId: timetable.teacherId, teacherName: users.name,
        dayOfWeek: timetable.dayOfWeek, startTime: timetable.startTime, endTime: timetable.endTime,
        room: timetable.room, term: timetable.term,
      })
      .from(timetable)
      .leftJoin(classes, eq(timetable.classId, classes.id))
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .leftJoin(teachers, eq(timetable.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(timetable.id, Number(id))).limit(1);

    res.json(updated);
  } catch (error: any) {
    console.error('[Timetable] Error updating:', error?.message);
    res.status(500).json({ error: 'Failed to update timetable entry' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(timetable).where(eq(timetable.id, Number(id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });
    await softDelete('timetable', Number(id));
    res.json({ message: 'Timetable entry deleted. Backup retained for 30 days.' });
  } catch (error: any) {
    console.error('[Timetable] Error deleting:', error?.message);
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});

export default router;
