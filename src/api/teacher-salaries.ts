import { Router } from 'express';
import { db } from '../db';
import { teacherSalaries, teachers, users } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { status } = req.query;
    const conditions: any[] = [];
    if (status) conditions.push(eq(teacherSalaries.status, String(status)));
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolTeacherIds = db.select({ id: teachers.id }).from(teachers).where(inArray(teachers.userId, schoolUserIds));
      conditions.push(inArray(teacherSalaries.teacherId, schoolTeacherIds));
    }

    let query = db
      .select({
        id: teacherSalaries.id,
        teacherId: teacherSalaries.teacherId,
        teacherName: users.name,
        employeeId: teachers.employeeId,
        basicSalary: teacherSalaries.basicSalary,
        housingAllowance: teacherSalaries.housingAllowance,
        transportAllowance: teacherSalaries.transportAllowance,
        medicalAllowance: teacherSalaries.medicalAllowance,
        otherAllowance: teacherSalaries.otherAllowance,
        taxDeduction: teacherSalaries.taxDeduction,
        insuranceDeduction: teacherSalaries.insuranceDeduction,
        otherDeduction: teacherSalaries.otherDeduction,
        effectiveDate: teacherSalaries.effectiveDate,
        status: teacherSalaries.status,
        createdAt: teacherSalaries.createdAt,
      })
      .from(teacherSalaries)
      .leftJoin(teachers, eq(teacherSalaries.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id));

    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const rows = await query.orderBy(desc(teacherSalaries.createdAt));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching teacher salaries:', error);
    res.status(500).json({ error: 'Failed to fetch teacher salaries' });
  }
});

router.post('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { teacherId, basicSalary, housingAllowance, transportAllowance, medicalAllowance, otherAllowance, taxDeduction, insuranceDeduction, otherDeduction, effectiveDate } = req.body;
    if (!teacherId || !basicSalary) return res.status(400).json({ error: 'teacherId and basicSalary are required' });

    if (schoolId) {
      const [teacher] = await db.select({ id: teachers.id }).from(teachers).leftJoin(users, eq(teachers.userId, users.id)).where(and(eq(teachers.id, Number(teacherId)), eq(users.schoolId, schoolId))).limit(1);
      if (!teacher) return res.status(403).json({ error: 'Teacher does not belong to your school' });
    }

    const [existing] = await db
      .select().from(teacherSalaries)
      .where(and(eq(teacherSalaries.teacherId, Number(teacherId)), eq(teacherSalaries.status, 'Active')))
      .limit(1);
    if (existing) await db.update(teacherSalaries).set({ status: 'Inactive' }).where(eq(teacherSalaries.id, existing.id));

    const [created] = await db
      .insert(teacherSalaries)
      .values({
        teacherId: Number(teacherId),
        basicSalary: Number(basicSalary),
        housingAllowance: Number(housingAllowance) || 0,
        transportAllowance: Number(transportAllowance) || 0,
        medicalAllowance: Number(medicalAllowance) || 0,
        otherAllowance: Number(otherAllowance) || 0,
        taxDeduction: Number(taxDeduction) || 0,
        insuranceDeduction: Number(insuranceDeduction) || 0,
        otherDeduction: Number(otherDeduction) || 0,
        effectiveDate: new Date(effectiveDate),
      })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating teacher salary:', error);
    res.status(500).json({ error: 'Failed to create teacher salary' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(teacherSalaries.id, Number(id))];
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolTeacherIds = db.select({ id: teachers.id }).from(teachers).where(inArray(teachers.userId, schoolUserIds));
      findConditions.push(inArray(teacherSalaries.teacherId, schoolTeacherIds));
    }
    const [existing] = await db.select().from(teacherSalaries).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Salary record not found' });

    const { basicSalary, housingAllowance, transportAllowance, medicalAllowance, otherAllowance, taxDeduction, insuranceDeduction, otherDeduction, effectiveDate, status } = req.body;
    await db
      .update(teacherSalaries)
      .set({
        ...(basicSalary !== undefined && { basicSalary: Number(basicSalary) }),
        ...(housingAllowance !== undefined && { housingAllowance: Number(housingAllowance) }),
        ...(transportAllowance !== undefined && { transportAllowance: Number(transportAllowance) }),
        ...(medicalAllowance !== undefined && { medicalAllowance: Number(medicalAllowance) }),
        ...(otherAllowance !== undefined && { otherAllowance: Number(otherAllowance) }),
        ...(taxDeduction !== undefined && { taxDeduction: Number(taxDeduction) }),
        ...(insuranceDeduction !== undefined && { insuranceDeduction: Number(insuranceDeduction) }),
        ...(otherDeduction !== undefined && { otherDeduction: Number(otherDeduction) }),
        ...(effectiveDate !== undefined && { effectiveDate: new Date(effectiveDate) }),
        ...(status !== undefined && { status }),
      })
      .where(eq(teacherSalaries.id, Number(id)));
    const [updated] = await db.select().from(teacherSalaries).where(eq(teacherSalaries.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating teacher salary:', error);
    res.status(500).json({ error: 'Failed to update teacher salary' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(teacherSalaries.id, Number(id))];
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolTeacherIds = db.select({ id: teachers.id }).from(teachers).where(inArray(teachers.userId, schoolUserIds));
      findConditions.push(inArray(teacherSalaries.teacherId, schoolTeacherIds));
    }
    const [existing] = await db.select().from(teacherSalaries).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Salary record not found' });
    await softDelete('teacher_salaries', Number(id));
    res.json({ message: 'Salary record deleted' });
  } catch (error) {
    console.error('Error deleting teacher salary:', error);
    res.status(500).json({ error: 'Failed to delete teacher salary' });
  }
});

export default router;
