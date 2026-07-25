import React, { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, Calendar } from 'lucide-react';
import api from '../lib/api.ts';
import { useAuth } from '../lib/useAuth.tsx';

export default function TeacherDashboard() {
  const { token, teacher } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get('/teachers/me/classes', { headers }),
      api.get('/teachers/me/students', { headers }),
      api.get('/teachers/me/subjects', { headers }),
    ]).then(([c, s, sub]) => {
      setClasses(Array.isArray(c.data) ? c.data : []);
      setStudents(Array.isArray(s.data) ? s.data : []);
      setSubjects(Array.isArray(sub.data) ? sub.data : []);
    }).finally(() => setLoading(false));
  }, [token]);

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
