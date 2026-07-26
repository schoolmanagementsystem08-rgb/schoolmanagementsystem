import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, CalendarCheck, DollarSign, Megaphone, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import api from '../lib/api.ts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stats'),
      api.get('/stats/monthly'),
      api.get('/announcements'),
    ]).then(([s, m, a]) => {
      setStats(s.data);
      setMonthly(Array.isArray(m.data) ? m.data : []);
      setAnnouncements(Array.isArray(a.data) ? a.data : []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/announcements');
        setAnnouncements(Array.isArray(res.data) ? res.data : []);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="text-center text-neutral-400 py-12">Loading dashboard...</p>;
  if (!stats) return <p className="text-center text-neutral-400 py-12">Failed to load data.</p>;

  const cards = [
    { label: 'Students', value: String(stats.students), sub: `${stats.activeStudents} active`, icon: Users, color: 'bg-blue-50 text-blue-700', iconBg: 'bg-blue-100' },
    { label: 'Teachers', value: String(stats.teachers), sub: 'On staff', icon: GraduationCap, color: 'bg-purple-50 text-purple-700', iconBg: 'bg-purple-100' },
    { label: 'Classes', value: String(stats.classes), sub: 'Active', icon: BookOpen, color: 'bg-green-50 text-green-700', iconBg: 'bg-green-100' },
    { label: 'Attendance', value: `${stats.attendanceRate}%`, sub: 'Overall', icon: CalendarCheck, color: 'bg-orange-50 text-orange-700', iconBg: 'bg-orange-100' },
    { label: 'Fees Collected', value: `$${(stats.fees.collected || 0).toLocaleString()}`, sub: `${stats.fees.count} records`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-700', iconBg: 'bg-emerald-100' },
    { label: 'Announcements', value: String(stats.announcements), sub: 'Posted', icon: Megaphone, color: 'bg-rose-50 text-rose-700', iconBg: 'bg-rose-100' },
  ];

  const hasCharts = monthly.length > 0;
  const feeData = monthly.map(m => ({ month: m.month, Collected: m.feesCollected, Outstanding: m.feesOutstanding }));
  const studentData = monthly.map(m => ({ month: m.month, Students: m.students }));
  const attendanceData = monthly.map(m => ({ month: m.month, Rate: m.attendanceRate }));

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString();
  };

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-neutral-600" />
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${card.color}`}>{card.label}</span>
            </div>
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-xs text-neutral-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {hasCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="text-sm font-bold mb-3">Fees Collected vs Outstanding</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={feeData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="Collected" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Outstanding" fill="#f97316" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="text-sm font-bold mb-3">Students per Month</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={studentData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="Students" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="text-sm font-bold mb-3">Attendance Rate</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={attendanceData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Rate" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          Latest Announcements
          <span className="text-[10px] text-neutral-400 font-normal">(auto-updates)</span>
        </h2>
        {announcements.length === 0 ? (
          <p className="text-neutral-400 text-sm">No announcements yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {announcements.slice(0, 6).map((a: any) => (
              <div key={a.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-white bg-black px-2 py-0.5 rounded-full">{a.targetRole || 'General'}</span>
                  <span className="text-[10px] text-neutral-400">{formatDate(a.createdAt)}</span>
                </div>
                <h3 className="text-sm font-bold mb-1">{a.title}</h3>
                <p className="text-xs text-neutral-500 line-clamp-2">{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
