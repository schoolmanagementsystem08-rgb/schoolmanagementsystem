import { Router } from 'express';
import { db } from '../db';
import { payrollRecords, teacherSalaries, teachers, users } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { softDelete } from '../lib/soft-delete';
import { authenticate } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { status, period, teacherId } = req.query;
    const conditions: any[] = [];
    if (status) conditions.push(eq(payrollRecords.status, String(status)));
    if (period) conditions.push(eq(payrollRecords.period, String(period)));
    if (teacherId) conditions.push(eq(payrollRecords.teacherId, Number(teacherId)));
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolTeacherIds = db.select({ id: teachers.id }).from(teachers).where(inArray(teachers.userId, schoolUserIds));
      conditions.push(inArray(payrollRecords.teacherId, schoolTeacherIds));
    }

    let query = db
      .select({
        id: payrollRecords.id,
        teacherId: payrollRecords.teacherId,
        teacherName: users.name,
        employeeId: teachers.employeeId,
        period: payrollRecords.period,
        basicSalary: payrollRecords.basicSalary,
        housingAllowance: payrollRecords.housingAllowance,
        transportAllowance: payrollRecords.transportAllowance,
        medicalAllowance: payrollRecords.medicalAllowance,
        otherAllowance: payrollRecords.otherAllowance,
        bonus: payrollRecords.bonus,
        taxDeduction: payrollRecords.taxDeduction,
        insuranceDeduction: payrollRecords.insuranceDeduction,
        otherDeduction: payrollRecords.otherDeduction,
        netPay: payrollRecords.netPay,
        paymentDate: payrollRecords.paymentDate,
        status: payrollRecords.status,
        notes: payrollRecords.notes,
        createdAt: payrollRecords.createdAt,
      })
      .from(payrollRecords)
      .leftJoin(teachers, eq(payrollRecords.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id));

    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const rows = await query.orderBy(desc(payrollRecords.period), desc(payrollRecords.createdAt));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
});

router.get('/periods', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const rows = await db
      .select({ period: payrollRecords.period })
      .from(payrollRecords)
      .groupBy(payrollRecords.period)
      .orderBy(desc(payrollRecords.period));
    const filtered = schoolId ? rows.filter(() => true) : rows;
    res.json(rows.map(r => r.period));
  } catch (error) {
    console.error('Error fetching periods:', error);
    res.status(500).json({ error: 'Failed to fetch periods' });
  }
});

router.post('/', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { teacherId, period, basicSalary, housingAllowance, transportAllowance, medicalAllowance, otherAllowance, bonus, taxDeduction, insuranceDeduction, otherDeduction, paymentDate, status, notes } = req.body;
    if (!teacherId || !period || !basicSalary) return res.status(400).json({ error: 'teacherId, period, and basicSalary are required' });

    if (schoolId) {
      const [teacher] = await db.select({ id: teachers.id }).from(teachers).leftJoin(users, eq(teachers.userId, users.id)).where(and(eq(teachers.id, Number(teacherId)), eq(users.schoolId, schoolId))).limit(1);
      if (!teacher) return res.status(403).json({ error: 'Teacher does not belong to your school' });
    }

    const h = Number(housingAllowance) || 0;
    const t = Number(transportAllowance) || 0;
    const m = Number(medicalAllowance) || 0;
    const o = Number(otherAllowance) || 0;
    const b = Number(bonus) || 0;
    const tx = Number(taxDeduction) || 0;
    const ins = Number(insuranceDeduction) || 0;
    const od = Number(otherDeduction) || 0;
    const totalAllowance = h + t + m + o;
    const totalDeduction = tx + ins + od;
    const netPay = Number(basicSalary) + totalAllowance + b - totalDeduction;

    const [created] = await db
      .insert(payrollRecords)
      .values({ teacherId: Number(teacherId), period, basicSalary: Number(basicSalary), housingAllowance: h, transportAllowance: t, medicalAllowance: m, otherAllowance: o, bonus: b, taxDeduction: tx, insuranceDeduction: ins, otherDeduction: od, netPay, paymentDate: paymentDate ? new Date(paymentDate) : null, status: status || 'Draft', notes: notes || null })
      .returning();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({ error: 'Failed to create payroll record' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { period } = req.body;
    if (!period) return res.status(400).json({ error: 'period (YYYY-MM) is required' });

    const [existing] = await db
      .select({ count: payrollRecords.id })
      .from(payrollRecords)
      .where(eq(payrollRecords.period, period))
      .limit(1);
    if (existing?.count > 0) return res.status(409).json({ error: `Payroll already exists for ${period}. Delete existing records first.` });

    let activeSalariesQuery = db
      .select({
        teacherId: teacherSalaries.teacherId,
        basicSalary: teacherSalaries.basicSalary,
        housingAllowance: teacherSalaries.housingAllowance,
        transportAllowance: teacherSalaries.transportAllowance,
        medicalAllowance: teacherSalaries.medicalAllowance,
        otherAllowance: teacherSalaries.otherAllowance,
        taxDeduction: teacherSalaries.taxDeduction,
        insuranceDeduction: teacherSalaries.insuranceDeduction,
        otherDeduction: teacherSalaries.otherDeduction,
        teacherName: users.name,
      })
      .from(teacherSalaries)
      .innerJoin(users, eq(teacherSalaries.teacherId, users.id))
      .where(eq(teacherSalaries.status, 'Active'));

    if (schoolId) {
      activeSalariesQuery = activeSalariesQuery.where(eq(users.schoolId, schoolId)) as any;
    }

    const activeSalaries = await activeSalariesQuery;

    if (activeSalaries.length === 0) return res.status(400).json({ error: 'No active salary structures found. Set up teacher salaries first.' });

    const values: any[] = [];
    for (const s of activeSalaries) {
      const h = Number(s.housingAllowance) || 0;
      const t = Number(s.transportAllowance) || 0;
      const m = Number(s.medicalAllowance) || 0;
      const o = Number(s.otherAllowance) || 0;
      const tx = Number(s.taxDeduction) || 0;
      const ins = Number(s.insuranceDeduction) || 0;
      const od = Number(s.otherDeduction) || 0;
      const netPay = Number(s.basicSalary) + h + t + m + o - tx - ins - od;
      values.push({
        teacherId: s.teacherId,
        period,
        basicSalary: Number(s.basicSalary),
        housingAllowance: h,
        transportAllowance: t,
        medicalAllowance: m,
        otherAllowance: o,
        bonus: 0,
        taxDeduction: tx,
        insuranceDeduction: ins,
        otherDeduction: od,
        netPay,
        status: 'Draft',
      });
    }

    const created = await db.insert(payrollRecords).values(values).returning();
    res.status(201).json({ message: `Generated ${created.length} payroll records for ${period}`, count: created.length });
  } catch (error) {
    console.error('Error generating payroll:', error);
    res.status(500).json({ error: 'Failed to generate payroll' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(payrollRecords.id, Number(id))];
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolTeacherIds = db.select({ id: teachers.id }).from(teachers).where(inArray(teachers.userId, schoolUserIds));
      findConditions.push(inArray(payrollRecords.teacherId, schoolTeacherIds));
    }
    const [existing] = await db.select().from(payrollRecords).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Payroll record not found' });

    const { basicSalary, housingAllowance, transportAllowance, medicalAllowance, otherAllowance, bonus, taxDeduction, insuranceDeduction, otherDeduction, paymentDate, status, notes } = req.body;

    const bs = basicSalary !== undefined ? Number(basicSalary) : existing.basicSalary;
    const h = housingAllowance !== undefined ? Number(housingAllowance) : existing.housingAllowance;
    const t = transportAllowance !== undefined ? Number(transportAllowance) : existing.transportAllowance;
    const m = medicalAllowance !== undefined ? Number(medicalAllowance) : existing.medicalAllowance;
    const o = otherAllowance !== undefined ? Number(otherAllowance) : existing.otherAllowance;
    const b = bonus !== undefined ? Number(bonus) : existing.bonus;
    const tx = taxDeduction !== undefined ? Number(taxDeduction) : existing.taxDeduction;
    const ins = insuranceDeduction !== undefined ? Number(insuranceDeduction) : existing.insuranceDeduction;
    const od = otherDeduction !== undefined ? Number(otherDeduction) : existing.otherDeduction;
    const netPay = bs + h + t + m + o + b - tx - ins - od;

    await db
      .update(payrollRecords)
      .set({
        basicSalary: bs,
        housingAllowance: h,
        transportAllowance: t,
        medicalAllowance: m,
        otherAllowance: o,
        bonus: b,
        taxDeduction: tx,
        insuranceDeduction: ins,
        otherDeduction: od,
        netPay,
        paymentDate: paymentDate !== undefined ? (paymentDate ? new Date(paymentDate) : null) : existing.paymentDate,
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      })
      .where(eq(payrollRecords.id, Number(id)));
    const [updated] = await db.select().from(payrollRecords).where(eq(payrollRecords.id, Number(id))).limit(1);
    res.json(updated);
  } catch (error) {
    console.error('Error updating payroll record:', error);
    res.status(500).json({ error: 'Failed to update payroll record' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;
    const findConditions: any[] = [eq(payrollRecords.id, Number(id))];
    if (schoolId) {
      const schoolUserIds = db.select({ id: users.id }).from(users).where(eq(users.schoolId, schoolId));
      const schoolTeacherIds = db.select({ id: teachers.id }).from(teachers).where(inArray(teachers.userId, schoolUserIds));
      findConditions.push(inArray(payrollRecords.teacherId, schoolTeacherIds));
    }
    const [existing] = await db.select().from(payrollRecords).where(and(...findConditions)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Payroll record not found' });
    await softDelete('payroll_records', Number(id));
    res.json({ message: 'Payroll record deleted' });
  } catch (error) {
    console.error('Error deleting payroll record:', error);
    res.status(500).json({ error: 'Failed to delete payroll record' });
  }
});

export default router;
