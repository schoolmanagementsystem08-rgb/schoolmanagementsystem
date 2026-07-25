import React, { useState, useEffect } from 'react';
import { Award, Plus, Edit2, Trash2, X, Download } from 'lucide-react';
import api from '../lib/api.ts';
import { useAuth } from '../lib/useAuth.tsx';

export default function TeacherGrades() {
  const { token } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ studentId: '', subjectId: '', score: '', maxScore: '100', term: 'Term 1' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterClass, setFilterClass] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const fetch = () => {
      Promise.all([
        api.get('/teachers/me/grades', { headers }),
        api.get('/teachers/me/students', { headers }),
        api.get('/teachers/me/subjects', { headers }),
      ]).then(([g, s, sub]) => {
        if (!mounted) return;
        setGrades(Array.isArray(g.data) ? g.data : []);
        setStudents(Array.isArray(s.data) ? s.data : []);
        setSubjects(Array.isArray(sub.data) ? sub.data : []);
      }).finally(() => { if (mounted) setLoading(false); });
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [token]);

  const filteredGrades = filterClass
    ? grades.filter(g => g.studentId && students.find(s => s.id === g.studentId)?.classId === Number(filterClass))
    : grades;

  const openAdd = () => { setEditing(null); setForm({ studentId: '', subjectId: '', score: '', maxScore: '100', term: 'Term 1' }); setShowModal(true); };

  const openEdit = (g: any) => {
    setEditing(g);
    setForm({ studentId: String(g.studentId), subjectId: String(g.subjectId), score: String(g.score), maxScore: String(g.maxScore), term: g.term });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.studentId || !form.subjectId || !form.score) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/grades/${editing.id}`, form);
      } else {
        await api.post('/grades', form);
      }
      setShowModal(false);
      const res = await api.get('/teachers/me/grades', { headers });
      setGrades(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to save grade', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/grades/${id}`);
      setDeleting(null);
      const res = await api.get('/teachers/me/grades', { headers });
      setGrades(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to delete grade', err);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await api.post('/reports/report-card', {
        studentName: 'All Students',
        grades: grades.map(g => ({ subject: g.subjectName, score: g.score, maxScore: g.maxScore, term: g.term })),
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Report_Card.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Report generation failed', err);
    }
  };

  const letterGrade = (score: number) => score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  if (loading) return <p className="text-center text-neutral-400 py-12">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grade Management</h1>
          <p className="text-neutral-500">Manage grades for your subjects</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Grade
          </button>
          <button onClick={downloadReport} className="flex items-center gap-2 bg-neutral-800 text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm"
              >
                <option value="">All Classes</option>
                {[...new Set(students.map(s => s.classId))].map(cid => {
                  const c = students.find(s => s.classId === cid);
                  return <option key={cid} value={cid}>{c?.className || `Class #${cid}`}</option>;
                })}
              </select>
            </div>
            {filteredGrades.length === 0 ? (
              <p className="text-center text-neutral-400 py-12">No grades recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Term</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Grade</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredGrades.map((g) => (
                      <tr key={g.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold">{g.studentName}</td>
                        <td className="px-6 py-4">{g.subjectName}</td>
                        <td className="px-6 py-4 text-neutral-500">{g.term}</td>
                        <td className="px-6 py-4 font-mono">
                          <span className="text-black font-bold">{g.score}</span>
                          <span className="text-neutral-300"> / {g.maxScore}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-neutral-600 text-sm">
                            {letterGrade(g.score)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(g)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleting(g.id)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-black text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold">GPA Summary</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-neutral-400">Average Score</span>
                <span className="text-4xl font-bold">
                  {grades.length > 0 ? (grades.reduce((a: number, g: any) => a + (g.score / g.maxScore) * 100, 0) / grades.length).toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400" style={{ width: `${grades.length > 0 ? (grades.reduce((a: number, g: any) => a + (g.score / g.maxScore) * 100, 0) / grades.length) : 0}%` }} />
              </div>
              <p className="text-sm text-neutral-400">Total Records: <span className="text-white font-bold">{grades.length}</span></p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editing ? 'Edit Grade' : 'Add Grade'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Student</label>
                <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white">
                  <option value="">Select student...</option>
                  {students.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Subject</label>
                <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white">
                  <option value="">Select subject...</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Score</label>
                  <input type="number" className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                    value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Max Score</label>
                  <input type="number" className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                    value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Term</label>
                <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white">
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.studentId || !form.subjectId || !form.score}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="text-lg font-bold mb-2">Delete Grade</h2>
              <p className="text-neutral-500 text-sm">Are you sure you want to delete this grade?</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={() => handleDelete(deleting)} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
