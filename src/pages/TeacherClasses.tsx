import React, { useState, useEffect } from 'react';
import { Users, BookOpen } from 'lucide-react';
import api from '../lib/api.ts';
import { useAuth } from '../lib/useAuth.tsx';

export default function TeacherClasses() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const fetch = () => {
      Promise.all([
        api.get('/teachers/me/classes', { headers }),
        api.get('/teachers/me/students', { headers }),
        api.get('/teachers/me/subjects', { headers }),
      ]).then(([c, s, sub]) => {
        if (!mounted) return;
        setClasses(Array.isArray(c.data) ? c.data : []);
        setStudents(Array.isArray(s.data) ? s.data : []);
        setSubjects(Array.isArray(sub.data) ? sub.data : []);
      }).finally(() => { if (mounted) setLoading(false); });
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [token]);

  if (loading) return <p className="text-center text-neutral-400 py-12">Loading...</p>;

  const filteredStudents = selectedClass
    ? students.filter(s => s.classId === selectedClass)
    : students;

  const classSubjects = selectedClass
    ? subjects.filter(s => s.classId === selectedClass)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
        <p className="text-neutral-500">View your assigned classes, subjects, and students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedClass === c.id
                  ? 'border-black bg-black text-white shadow-lg'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedClass === c.id ? 'bg-white/10' : 'bg-neutral-100'
                }`}>
                  <BookOpen className={`w-5 h-5 ${selectedClass === c.id ? 'text-white' : 'text-neutral-600'}`} />
                </div>
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className={`text-xs ${selectedClass === c.id ? 'text-white/70' : 'text-neutral-500'}`}>
                    {c.academicYear}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {classes.length === 0 && (
            <p className="text-neutral-400 text-sm text-center py-8">No classes assigned.</p>
          )}

          {selectedClass && classSubjects.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Subjects</h3>
              <div className="space-y-2">
                {classSubjects.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-neutral-400" />
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-400" />
              <h2 className="font-bold">
                {selectedClass
                  ? `Students in ${classes.find(c => c.id === selectedClass)?.name}`
                  : 'All Students'}
              </h2>
              <span className="ml-auto text-sm text-neutral-400">{filteredStudents.length} students</span>
            </div>
            {filteredStudents.length === 0 ? (
              <p className="text-center text-neutral-400 py-12">No students found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Class</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">{s.name}</td>
                        <td className="px-6 py-4 text-neutral-500">{s.email}</td>
                        <td className="px-6 py-4">{s.className}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            s.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'
                          }`}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
