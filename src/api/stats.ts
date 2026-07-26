import { Router } from 'express';
import { db } from '../db';
import { students, users, classes, teachers, attendance, fees, announcements } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(students);
    const [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(teachers);
    const [classCount] = await db.select({ count: sql<number>`count(*)` }).from(classes);
    const [announcementCount] = await db.select({ count: sql<number>`count(*)` }).from(announcements);

    const [activeStudents] = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(eq(students.status, 'Active'));

    const [presentEntries] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(eq(attendance.status, 'present'));
    const [totalAttendance] = await db.select({ count: sql<number>`count(*)` }).from(attendance);
    const attendanceRate = totalAttendance.count > 0
      ? Math.round((presentEntries.count / totalAttendance.count) * 100)
      : 0;

    const feeRows = await db.select({
      status: fees.status,
      total: sql<number>`sum(${fees.amount})`,
      count: sql<number>`count(*)`,
    }).from(fees).groupBy(fees.status);

    let collectedFees = 0;
    let outstandingFees = 0;
    let totalFeeCount = 0;
    for (const row of feeRows) {
      totalFeeCount += Number(row.count);
      if (row.status === 'Paid') {
        collectedFees += Number(row.total) || 0;
      } else {
        outstandingFees += Number(row.total) || 0;
      }
    }

    res.json({
      students: Number(studentCount.count),
      activeStudents: Number(activeStudents.count),
      teachers: Number(teacherCount.count),
      classes: Number(classCount.count),
      announcements: Number(announcementCount.count),
      attendanceRate,
      fees: {
        collected: collectedFees,
        outstanding: outstandingFees,
        total: collectedFees + outstandingFees,
        count: totalFeeCount,
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

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = d.toLocaleString('default', { month: 'short' });

      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);

      const [studentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(students)
        .where(sql`${students.enrollmentDate} >= ${start} AND ${students.enrollmentDate} < ${end}`);

      const [presentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(attendance)
        .where(sql`${attendance.date} >= ${start} AND ${attendance.date} < ${end} AND ${attendance.status} = 'present'`);
      const [totalAtt] = await db
        .select({ count: sql<number>`count(*)` })
        .from(attendance)
        .where(sql`${attendance.date} >= ${start} AND ${attendance.date} < ${end}`);
      const attRate = totalAtt.count > 0 ? Math.round((presentCount.count / totalAtt.count) * 100) : 0;

      const feeRows = await db
        .select({
          status: fees.status,
          total: sql<number>`coalesce(sum(${fees.amount}), 0)`,
        })
        .from(fees)
        .where(sql`${fees.dueDate} >= ${start} AND ${fees.dueDate} < ${end}`)
        .groupBy(fees.status);

      let collected = 0, outstanding = 0;
      for (const r of feeRows) {
        if (r.status === 'Paid') collected += Number(r.total);
        else outstanding += Number(r.total);
      }

      monthlyData.push({
        month: monthStr,
        students: Number(studentCount.count),
        attendanceRate: attRate,
        feesCollected: collected,
        feesOutstanding: outstanding,
      });
    }

    res.json(monthlyData);
  } catch (error: any) {
    console.error('[Stats /monthly] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch monthly stats' });
  }
});

router.get('/recent-activity', async (req, res) => {
  try {
    const recentAnnouncements = await db
      .select({ id: announcements.id, title: announcements.title, createdAt: announcements.createdAt })
      .from(announcements)
      .orderBy(sql`${announcements.createdAt} desc`)
      .limit(5);

    const classDistribution = await db
      .select({
        className: classes.name,
        count: sql<number>`count(*)`,
      })
      .from(students)
      .rightJoin(classes, eq(students.classId, classes.id))
      .groupBy(classes.id, classes.name)
      .orderBy(classes.name);

    res.json({
      recentAnnouncements,
      classDistribution,
    });
  } catch (error: any) {
    console.error('[Stats /recent-activity] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
