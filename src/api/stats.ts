import { Router } from 'express';
import { db } from '../db';
import { students, users, classes, teachers, attendance, fees, announcements } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT
        (SELECT count(*) FROM students)::int as students,
        (SELECT count(*) FROM students WHERE status = 'Active')::int as active_students,
        (SELECT count(*) FROM teachers)::int as teachers,
        (SELECT count(*) FROM classes)::int as classes,
        (SELECT count(*) FROM announcements)::int as announcements,
        CASE WHEN (SELECT count(*) FROM attendance) > 0 THEN
          round((SELECT count(*) FROM attendance WHERE status = 'present')::decimal / (SELECT count(*) FROM attendance) * 100)::int
        ELSE 0 END as attendance_rate,
        COALESCE((SELECT sum(amount) FROM fees WHERE status = 'Paid'), 0)::int as fees_collected,
        COALESCE((SELECT sum(amount) FROM fees WHERE status != 'Paid'), 0)::int as fees_outstanding,
        (SELECT count(*) FROM fees)::int as fee_count
    `);
    const r = result.rows[0];
    res.json({
      students: Number(r.students),
      activeStudents: Number(r.active_students),
      teachers: Number(r.teachers),
      classes: Number(r.classes),
      announcements: Number(r.announcements),
      attendanceRate: Number(r.attendance_rate),
      fees: {
        collected: Number(r.fees_collected),
        outstanding: Number(r.fees_outstanding),
        total: Number(r.fees_collected) + Number(r.fees_outstanding),
        count: Number(r.fee_count),
      },
    });
  } catch (error: any) {
    console.error('[Stats] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const months = 6;
    const monthlyData: { month: string; students: number; attendanceRate: number; feesCollected: number; feesOutstanding: number }[] = [];

    const enrollmentMonth = sql`EXTRACT(YEAR FROM ${students.enrollmentDate}) * 12 + EXTRACT(MONTH FROM ${students.enrollmentDate})`;
    const attendanceMonth = sql`EXTRACT(YEAR FROM ${attendance.date}) * 12 + EXTRACT(MONTH FROM ${attendance.date})`;
    const feeMonth = sql`EXTRACT(YEAR FROM ${fees.dueDate}) * 12 + EXTRACT(MONTH FROM ${fees.dueDate})`;

    const [enrollData] = await db
      .select({ month: enrollmentMonth, count: sql<number>`count(*)` })
      .from(students)
      .where(sql`${students.enrollmentDate} >= (NOW() - interval '6 months')`)
      .groupBy(enrollmentMonth)
      .orderBy(enrollmentMonth);

    const attData = await db
      .select({ month: attendanceMonth, status: attendance.status, count: sql<number>`count(*)` })
      .from(attendance)
      .where(sql`${attendance.date} >= (NOW() - interval '6 months')`)
      .groupBy(attendanceMonth, attendance.status)
      .orderBy(attendanceMonth);

    const feeData = await db
      .select({ month: feeMonth, status: fees.status, total: sql<number>`coalesce(sum(${fees.amount}), 0)` })
      .from(fees)
      .where(sql`${fees.dueDate} >= (NOW() - interval '6 months')`)
      .groupBy(feeMonth, fees.status)
      .orderBy(feeMonth);

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const m = d.getFullYear() * 12 + (d.getMonth() + 1);

      const monthEnroll = Array.isArray(enrollData) ? enrollData.filter((r: any) => Number(r.month) === m).reduce((sum: number, r: any) => sum + Number(r.count), 0) : 0;
      const monthAttRows = attData.filter((r: any) => Number(r.month) === m);
      const attTotal = monthAttRows.reduce((s: number, r: any) => s + Number(r.count), 0);
      const attPresent = monthAttRows.filter((r: any) => r.status === 'present').reduce((s: number, r: any) => s + Number(r.count), 0);
      const attRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;
      const monthFees = feeData.filter((r: any) => Number(r.month) === m);
      let collected = 0, outstanding = 0;
      for (const r of monthFees) {
        if (r.status === 'Paid') collected += Number(r.total);
        else outstanding += Number(r.total);
      }

      monthlyData.push({ month: monthStr, students: Number(monthEnroll), attendanceRate: attRate, feesCollected: collected, feesOutstanding: outstanding });
    }

    res.json(monthlyData);
  } catch (error: any) {
    console.error('[Stats /monthly] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch monthly stats' });
  }
});

router.get('/recent-activity', async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT
        (SELECT json_agg(row_to_json(a)) FROM (SELECT id, title, created_at as "createdAt" FROM announcements ORDER BY created_at DESC LIMIT 5) a) as recent_announcements,
        (SELECT json_agg(row_to_json(d)) FROM (SELECT c.name as "className", count(s.*)::int as count FROM classes c LEFT JOIN students s ON s.class_id = c.id GROUP BY c.id, c.name ORDER BY c.name) d) as class_distribution
    `);
    const r = result.rows[0];
    res.json({
      recentAnnouncements: r.recent_announcements || [],
      classDistribution: r.class_distribution || [],
    });
  } catch (error: any) {
    console.error('[Stats /recent-activity] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
