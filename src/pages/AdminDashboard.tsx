import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, CalendarCheck, DollarSign, Megaphone, TrendingUp } from 'lucide-react';
import api from '../lib/api.ts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stats'),
      api.get('/stats/recent-activity'),
    ]).then(([s, a]) => {
      setStats(s.data);
      setActivity(a.data);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-neutral-400 py-12">Loading dashboard...</p>;
  if (!stats) return <p className="text-center text-neutral-400 py-12">Failed to load data.</p>;

  const cards = [
    { label: 'Total Students', value: String(stats.students), sub: `${stats.activeStudents} active`, icon: Users, color: 'bg-blue-50 text-blue-700', iconBg: 'bg-blue-100' },
    { label: 'Teachers', value: String(stats.teachers), sub: 'On staff', icon: GraduationCap, color: 'bg-purple-50 text-purple-700', iconBg: 'bg-purple-100' },
    { label: 'Classes', value: String(stats.classes), sub: 'Active', icon: BookOpen, color: 'bg-green-50 text-green-700', iconBg: 'bg-green-100' },
    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, sub: 'Overall', icon: CalendarCheck, color: 'bg-orange-50 text-orange-700', iconBg: 'bg-orange-100' },
    { label: 'Fees Collected', value: `$${(stats.fees.collected || 0).toLocaleString()}`, sub: `${stats.fees.count} records`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-700', iconBg: 'bg-emerald-100' },
    { label: 'Announcements', value: String(stats.announcements), sub: 'Posted', icon: Megaphone, color: 'bg-rose-50 text-rose-700', iconBg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-neutral-500 mt-1">School overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-neutral-200 text-sm text-neutral-500">
          <TrendingUp className="w-4 h-4" />
          <span>All time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-neutral-600" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${card.color}`}>{card.label}</span>
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-neutral-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Class Distribution</h2>
          {!activity?.classDistribution?.length ? (
            <p className="text-neutral-400 text-sm">No classes yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.classDistribution.map((c: any, i: number) => {
                const maxCount = Math.max(...activity.classDistribution.map((x: any) => Number(x.count)));
                const pct = maxCount > 0 ? (Number(c.count) / maxCount) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{c.className}</span>
                      <span className="text-neutral-500">{c.count} students</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Recent Announcements</h2>
          {!activity?.recentAnnouncements?.length ? (
            <p className="text-neutral-400 text-sm">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.recentAnnouncements.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <span className="font-medium text-sm">{a.title}</span>
                  <span className="text-xs text-neutral-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-black text-white p-6 rounded-2xl shadow-xl lg:col-span-2">
          <h2 className="text-lg font-bold mb-4">Fee Summary</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-neutral-400 text-sm">Collected</p>
              <p className="text-2xl font-bold text-green-400">${(stats.fees.collected || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm">Outstanding</p>
              <p className="text-2xl font-bold text-orange-400">${(stats.fees.outstanding || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm">Total</p>
              <p className="text-2xl font-bold">${(stats.fees.total || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: `${stats.fees.total > 0 ? (stats.fees.collected / stats.fees.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">{stats.fees.total > 0 ? Math.round((stats.fees.collected / stats.fees.total) * 100) : 0}% collected</p>
        </div>
      </div>
    </div>
  );
}
