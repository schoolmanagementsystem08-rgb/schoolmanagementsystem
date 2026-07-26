import React, { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, Calendar, Clock, AlertTriangle, MapPin } from 'lucide-react';
import api from '../lib/api.ts';
import { useAuth } from '../lib/useAuth.tsx';

export default function TeacherDashboard() {
  const { token, teacher } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<any[]>([]);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const fetch = () => {
      Promise.all([
        api.get('/teachers/me/classes', { headers }),
        api.get('/teachers/me/students', { headers }),
        api.get('/teachers/me/subjects', { headers }),
        api.get('/timetable', { params: { teacherId: teacher?.id }, headers }),
      ]).then(([c, s, sub, tt]) => {
        if (!mounted) return;
        setClasses(Array.isArray(c.data) ? c.data : []);
        setStudents(Array.isArray(s.data) ? s.data : []);
        setSubjects(Array.isArray(sub.data) ? sub.data : []);
        setTimetable(Array.isArray(tt.data) ? tt.data : []);
      }).finally(() => { if (mounted) setLoading(false); });
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [token]);

  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1; // Convert JS Sunday=0 to Mon=0..Sun=6
  const todaySlots = timetable.filter(e => e.dayOfWeek === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSlot = todaySlots.find(e => {
    const start = timeToMinutes(e.startTime);
    const end = timeToMinutes(e.endTime);
    return nowMinutes >= start && nowMinutes < end;
  });
  const nextSlot = todaySlots.find(e => timeToMinutes(e.startTime) > nowMinutes);

  const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function timeToMinutes(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  function toTime12(t: string) { if (!t) return ''; const [h, m] = t.split(':'); const hour = parseInt(h); return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`; }

  if (loading) return <p className="text-center text-neutral-400 py-12">Loading dashboard...</p>;

  const stats = [
    { label: 'My Classes', value: String(classes.length), change: 'Active', icon: BookOpen, color: 'bg-blue-50 text-blue-700' },
    { label: 'My Students', value: String(students.length), change: 'Enrolled', icon: Users, color: 'bg-green-50 text-green-700' },
    { label: 'My Subjects', value: String(subjects.length), change: 'Teaching', icon: GraduationCap, color: 'bg-purple-50 text-purple-700' },
    { label: 'Total Classes', value: String(classes.length), change: 'Assigned', icon: Calendar, color: 'bg-orange-50 text-orange-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {teacher?.name || 'Teacher'}</h1>
          <p className="text-neutral-500">{teacher?.specialization || 'Educator'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-neutral-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            <div className={`mt-2 px-2 py-0.5 rounded-full text-xs font-semibold inline-block ${stat.color}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {currentSlot && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">Current Class: {currentSlot.subjectName}</p>
            <p className="text-xs text-amber-700">{currentSlot.className} &middot; {toTime12(currentSlot.startTime)} - {toTime12(currentSlot.endTime)}{currentSlot.room ? ` &middot; ${currentSlot.room}` : ''}</p>
          </div>
        </div>
      )}

      {nextSlot && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-blue-800">
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">Up Next: {nextSlot.subjectName}</p>
            <p className="text-xs text-blue-700">{nextSlot.className} &middot; {toTime12(nextSlot.startTime)} - {toTime12(nextSlot.endTime)}{nextSlot.room ? ` &middot; ${nextSlot.room}` : ''}</p>
          </div>
        </div>
      )}

      {todaySlots.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Today's Schedule ({DAYS_SHORT[dayIndex]})</h2>
          <div className="space-y-2">
            {todaySlots.map((slot: any) => {
              const isNow = currentSlot?.id === slot.id;
              return (
                <div key={slot.id} className={`flex items-center gap-4 p-3 rounded-xl ${isNow ? 'bg-amber-50 border border-amber-200' : 'bg-neutral-50'}`}>
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs font-mono font-bold">{toTime12(slot.startTime)}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">{toTime12(slot.endTime)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{slot.subjectName}</p>
                    <p className="text-xs text-neutral-500">{slot.className}{slot.room ? ` · ${slot.room}` : ''}</p>
                  </div>
                  {isNow && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">NOW</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">My Classes</h2>
          {classes.length === 0 ? (
            <p className="text-neutral-400 text-sm">No classes assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-sm text-neutral-500">{c.academicYear}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">My Subjects</h2>
          {subjects.length === 0 ? (
            <p className="text-neutral-400 text-sm">No subjects assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-sm text-neutral-500">{s.className}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
