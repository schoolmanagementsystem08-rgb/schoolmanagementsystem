import { Router } from 'express';
import { db } from '../db';
import { timetable, classes, subjects, teachers, users } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { classId, teacherId, dayOfWeek } = req.query;
    const filters: any[] = [];
    if (classId) filters.push(eq(timetable.classId, Number(classId)));
    if (teacherId) filters.push(eq(timetable.teacherId, Number(teacherId)));
    if (dayOfWeek) filters.push(eq(timetable.dayOfWeek, Number(dayOfWeek)));
    if (schoolId) {
      const schoolClassIds = db.select({ id: classes.id }).from(classes).where(eq(classes.schoolId, schoolId));
      filters.push(inArray(timetable.classId, schoolClassIds));
    }

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
    const schoolId = (req as any).user?.schoolId;
    const { classId } = req.params;
    const filters: any[] = [eq(timetable.classId, Number(classId))];
    if (schoolId) {
      const schoolClassIds = db.select({ id: classes.id }).from(classes).where(eq(classes.schoolId, schoolId));
      filters.push(inArray(timetable.classId, schoolClassIds));
    }
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
      .where(and(...filters))
      .orderBy(timetable.dayOfWeek, timetable.startTime);
    res.json(rows);
  } catch (error: any) {
    console.error('[Timetable] Error fetching class timetable:', error?.message);
    res.status(500).json({ error: 'Failed to fetch class timetable' });
  }
});

router.post('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, term } = req.body;
    if (classId == null || subjectId == null || teacherId == null || dayOfWeek == null || !startTime || !endTime) {
      return res.status(400).json({ error: 'classId, subjectId, teacherId, dayOfWeek, startTime, endTime are required' });
    }
    if (schoolId) {
      const [classInfo] = await db.select().from(classes).where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId))).limit(1);
      if (!classInfo) return res.status(403).json({ error: 'Class does not belong to your school' });
    }
    const [subject] = await db.select({ classId: subjects.classId, teacherId: subjects.teacherId }).from(subjects).where(eq(subjects.id, subjectId)).limit(1);
    if (!subject) return res.status(400).json({ error: 'Subject not found' });
    if (subject.classId !== classId) return res.status(400).json({ error: 'Subject does not belong to the selected class' });
    if (subject.teacherId && subject.teacherId !== teacherId) return res.status(400).json({ error: 'Teacher does not match the subject\'s assigned teacher' });
    const [created] = await db.insert(timetable).values({ classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, term }).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error('[Timetable] Error creating:', error?.message);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, term } = req.body;
    const findConditions: any[] = [eq(timetable.id, Number(id))];
    if (schoolId) {
      const schoolClassIds = db.select({ id: classes.id }).from(classes).where(eq(classes.schoolId, schoolId));
      findConditions.push(inArray(timetable.classId, schoolClassIds));
    }
    const [existing] = await db.select().from(timetable).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    const effClassId = classId ?? existing.classId;
    const effSubjectId = subjectId ?? existing.subjectId;
    const effTeacherId = teacherId ?? existing.teacherId;
    const [subject] = await db.select({ cid: subjects.classId, tid: subjects.teacherId }).from(subjects).where(eq(subjects.id, effSubjectId)).limit(1);
    if (!subject) return res.status(400).json({ error: 'Subject not found' });
    if (subject.cid !== effClassId) return res.status(400).json({ error: 'Subject does not belong to the selected class' });
    if (subject.tid && subject.tid !== effTeacherId) return res.status(400).json({ error: 'Teacher does not match the subject\'s assigned teacher' });

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
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(timetable.id, Number(id))];
    if (schoolId) {
      const schoolClassIds = db.select({ id: classes.id }).from(classes).where(eq(classes.schoolId, schoolId));
      findConditions.push(inArray(timetable.classId, schoolClassIds));
    }
    const [existing] = await db.select().from(timetable).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });
    await softDelete('timetable', Number(id));
    res.json({ message: 'Timetable entry deleted. Backup retained for 30 days.' });
  } catch (error: any) {
    console.error('[Timetable] Error deleting:', error?.message);
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});

export default router;
