import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, Download } from 'lucide-react';
import api from '../lib/api.ts';
import { useAuth } from '../lib/useAuth.tsx';

export default function TeacherAttendance() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    loadClasses();
  }, [token]);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && date) {
      loadExistingAttendance();
    }
  }, [selectedClass, date]);

  const loadClasses = async () => {
    try {
      const res = await api.get('/teachers/me/classes', { headers });
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers/me/students', { headers });
      const all = Array.isArray(res.data) ? res.data : [];
      setStudents(all.filter((s: any) => String(s.classId) === selectedClass));
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAttendance = async () => {
    try {
      const res = await api.get(`/attendance/class/${selectedClass}`, { params: { date } });
      if (res.data.attendance) {
        setAttendance(res.data.attendance);
      }
    } catch (err) {
      console.error('Failed to load attendance', err);
    }
  };

  const setStatus = (studentId: number, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: prev[studentId] === status ? '' : status }));
  };

  const handleSave = async () => {
    if (!selectedClass || !date) return;
    setSaving(true);
    try {
      await api.post('/attendance/batch', { classId: Number(selectedClass), date, records: attendance });
      setMessage('Attendance saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async () => {
    if (!selectedClass || !date) return;
    try {
      const records = students.map((s: any) => [s.name, attendance[s.id] || 'Not marked']);
      const payload = Object.fromEntries(records);

      const response = await api.post('/teachers/attendance/report', {
        classId: Number(selectedClass),
        date,
        records: payload,
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const className = classes.find((c: any) => String(c.id) === selectedClass)?.name || 'class';
      link.setAttribute('download', `Attendance_${className}_${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download report', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-neutral-500">Mark attendance for your classes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
          <button onClick={downloadReport} disabled={!selectedClass || !date}
            className="flex items-center gap-2 bg-neutral-800 text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-700 disabled:opacity-50 transition-all shadow-sm">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-200">
          {message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
        </div>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
          className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl bg-white">
          <option value="">Select class...</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="font-bold">
            {selectedClass
              ? `Class: ${classes.find((c: any) => String(c.id) === selectedClass)?.name}`
              : 'Select a class to begin'}
          </h2>
        </div>

        {selectedClass && loading ? (
          <p className="text-center text-neutral-400 py-12">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-neutral-400 py-12">No students in this class.</p>
        ) : selectedClass ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 text-center">Present</th>
                  <th className="px-6 py-4 text-center">Absent</th>
                  <th className="px-6 py-4 text-center">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{student.name}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setStatus(student.id, 'present')}
                        className={`w-9 h-9 rounded-xl transition-all ${
                          attendance[student.id] === 'present'
                            ? 'bg-green-500 text-white shadow-md shadow-green-200'
                            : 'bg-neutral-100 text-neutral-400 hover:bg-green-50 hover:text-green-500'
                        }`}>
                        <Check className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setStatus(student.id, 'absent')}
                        className={`w-9 h-9 rounded-xl transition-all ${
                          attendance[student.id] === 'absent'
                            ? 'bg-red-500 text-white shadow-md shadow-red-200'
                            : 'bg-neutral-100 text-neutral-400 hover:bg-red-50 hover:text-red-500'
                        }`}>
                        <X className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setStatus(student.id, 'late')}
                        className={`w-9 h-9 rounded-xl transition-all ${
                          attendance[student.id] === 'late'
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                            : 'bg-neutral-100 text-neutral-400 hover:bg-orange-50 hover:text-orange-500'
                        }`}>
                        <Clock className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
