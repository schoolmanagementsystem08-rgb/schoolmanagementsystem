import React, { useState, useEffect } from 'react';
import { FileText, Download, Users } from 'lucide-react';
import api from '../lib/api.ts';
import { useAuth } from '../lib/useAuth.tsx';

export default function TeacherReports() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get('/teachers/me/classes', { headers }),
      api.get('/teachers/me/students', { headers }),
    ]).then(([c, s]) => {
      setClasses(Array.isArray(c.data) ? c.data : []);
      setStudents(Array.isArray(s.data) ? s.data : []);
    });
  }, [token]);

  const filteredStudents = selectedClass
    ? students.filter((s: any) => String(s.classId) === selectedClass)
    : [];

  const downloadAcademicReport = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    try {
      const studentGrades = await api.get('/grades', { params: { studentId: Number(selectedStudent) } });
      const grades = Array.isArray(studentGrades.data) ? studentGrades.data : [];
      const student = students.find((s: any) => String(s.id) === selectedStudent);

      const response = await api.post('/reports/report-card', {
        studentName: student?.name || 'Student',
        grades: grades.map((g: any) => ({ subject: g.subjectName, score: g.score, maxScore: g.maxScore, term: g.term })),
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_Card_${student?.name || 'student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setGenerating(false);
    }
  };

  const downloadAttendanceReport = async () => {
    if (!selectedClass || !date) return;
    setGenerating(true);
    try {
      const attRes = await api.get(`/attendance/class/${selectedClass}`, { params: { date } });
      const records = attRes.data.students?.map((s: any) => [s.name, attRes.data.attendance?.[s.id] || 'Not marked']) || [];
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
      console.error('Failed to generate attendance report', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-neutral-500">Generate academic and attendance reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold">Academic Report</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Class</label>
              <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(''); }}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white">
                <option value="">Select class...</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Student</label>
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white" disabled={!selectedClass}>
                <option value="">Select student...</option>
                {filteredStudents.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={downloadAcademicReport} disabled={!selectedStudent || generating}
              className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 transition-all">
              <Download className="w-4 h-4" />
              {generating ? 'Generating...' : 'Download Report Card'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold">Attendance Report</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white">
                <option value="">Select class...</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl" />
            </div>
            <button onClick={downloadAttendanceReport} disabled={!selectedClass || !date || generating}
              className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 transition-all">
              <Download className="w-4 h-4" />
              {generating ? 'Generating...' : 'Download Attendance Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
