import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Save, User } from 'lucide-react';
import api from '../lib/api.ts';
import { toastSuccess, toastError } from '../lib/alerts.ts';

interface ClassOption {
  id: number;
  name: string;
  academicYear: string;
}

interface StudentBrief {
  id: number;
  name: string;
  email: string;
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentBrief[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/classes').then(res => {
      if (Array.isArray(res.data)) setClasses(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass || !attendanceDate) return;
    setLoading(true);
    api.get(`/attendance/class/${selectedClass}`, { params: { date: attendanceDate } })
      .then(res => {
        setStudents(res.data.students || []);
        setAttendance(res.data.attendance || {});
      })
      .catch(err => console.error('Failed to load attendance', err))
      .finally(() => setLoading(false));
  }, [selectedClass, attendanceDate]);

  const markStatus = (id: number, status: string) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = async () => {
    if (!selectedClass || !attendanceDate) return;
    setSaving(true);
    try {
      await api.post('/attendance/batch', { classId: Number(selectedClass), date: attendanceDate, records: attendance });
      toastSuccess('Attendance saved successfully!');
    } catch (err) {
      console.error('Failed to save attendance', err);
      toastError('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
          <p className="text-neutral-500">Record daily attendance for your classes</p>
        </div>
        <div className="flex gap-2">
          <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none bg-white" />
          <button onClick={handleSave} disabled={saving || !selectedClass}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Sheet'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center gap-4 bg-neutral-50/50">
          <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Class:</span>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-transparent font-bold text-lg outline-none cursor-pointer">
            <option value="">Select a class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {!selectedClass ? (
          <p className="text-center text-neutral-400 py-12">Select a class to take attendance.</p>
        ) : loading ? (
          <p className="text-center text-neutral-400 py-12">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-neutral-400 py-12">No students enrolled in this class.</p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-6 hover:bg-neutral-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{student.name}</p>
                    <p className="text-sm text-neutral-400 font-mono tracking-tighter uppercase">ID: STD-{String(student.id).padStart(4, '0')}</p>
                  </div>
                </div>
                <div className="flex bg-neutral-100 p-1 rounded-xl gap-1">
                  {[
                    { id: 'present', label: 'Present', icon: CheckCircle2, color: 'text-green-600' },
                    { id: 'absent', label: 'Absent', icon: XCircle, color: 'text-red-500' },
                    { id: 'late', label: 'Late', icon: Clock, color: 'text-orange-500' },
                  ].map((status) => (
                    <button key={status.id}
                      onClick={() => markStatus(student.id, status.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                        attendance[student.id] === status.id
                          ? `bg-white shadow-sm ring-1 ring-black/5 ${status.color}`
                          : 'text-neutral-400 hover:text-neutral-600'
                      }`}>
                      <status.icon className="w-4 h-4" />
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
