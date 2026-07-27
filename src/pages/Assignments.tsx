import React, { useState, useEffect } from 'react';
import { FileText, Plus, Clock, ChevronRight, Edit2, Trash2, X } from 'lucide-react';
import api from '../lib/api.ts';
import { confirmDelete, toastSuccess, toastError } from '../lib/alerts.ts';

interface Assignment {
  id: number;
  title: string;
  subjectId: number;
  subjectName: string;
  dueDate: string;
  description: string | null;
}

interface Subject {
  id: number;
  name: string;
}

interface AssignmentForm {
  title: string;
  subjectId: string;
  dueDate: string;
  description: string;
}

const emptyForm: AssignmentForm = { title: '', subjectId: '', dueDate: '', description: '' };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'completed'>('current');

  useEffect(() => {
    Promise.all([
      api.get('/assignments'),
      api.get('/subjects'),
    ]).then(([a, s]) => {
      setAssignments(Array.isArray(a.data) ? a.data : []);
      setSubjects(Array.isArray(s.data) ? s.data : []);
    }).catch(err => console.error('Failed to load data', err))
    .finally(() => setIsLoading(false));
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (a: Assignment) => {
    setEditing(a);
    setForm({
      title: a.title,
      subjectId: String(a.subjectId),
      dueDate: a.dueDate ? a.dueDate.split('T')[0] : '',
      description: a.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.subjectId || !form.dueDate) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/assignments/${editing.id}`, form);
      } else {
        await api.post('/assignments', form);
      }
      setShowModal(false);
      const res = await api.get('/assignments');
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to save assignment', err);
    } finally {
      setSaving(false);
    }
  };

  const fetchAssignments = async () => {
    const res = await api.get('/assignments');
    setAssignments(Array.isArray(res.data) ? res.data : []);
  };

  const handleDelete = async (id: number) => {
    const result = await confirmDelete('this assignment');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/assignments/${id}`);
      toastSuccess('Assignment deleted');
      await fetchAssignments();
    } catch (err) { toastError('Failed to delete assignment'); console.error(err); }
  };

  const today = new Date();
  const currentAssignments = assignments.filter(a => new Date(a.dueDate) >= today);
  const completedAssignments = assignments.filter(a => new Date(a.dueDate) < today);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-neutral-500">Track and submit your coursework</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-neutral-100">
              {['Current', 'Completed'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab.toLowerCase() as any)}
                  className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${
                    activeTab === tab.toLowerCase() ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'
                  }`}>{tab}</button>
              ))}
            </div>

            {isLoading ? (
              <p className="text-center text-neutral-400 py-12">Loading assignments...</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {(activeTab === 'current' ? currentAssignments : completedAssignments).length === 0 ? (
                  <p className="text-center text-neutral-400 py-12">No assignments found.</p>
                ) : (
                  (activeTab === 'current' ? currentAssignments : completedAssignments).map((assignment) => (
                    <div key={assignment.id} className="p-6 hover:bg-neutral-50/50 transition-all flex items-center justify-between group">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-black group-hover:text-white transition-all duration-300">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-snug">{assignment.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <span className="font-semibold text-neutral-500">{assignment.subjectName}</span>
                            <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                            <span className="flex items-center gap-1.5 text-neutral-400">
                              <Clock className="w-3.5 h-3.5" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          {assignment.description && (
                            <p className="text-sm text-neutral-400 mt-2">{assignment.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(assignment)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(assignment.id)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-neutral-300" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-2xl">
            <h2 className="font-bold text-lg mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-neutral-100">
                <span className="text-sm font-medium">Current</span>
                <span className="text-lg font-bold">{currentAssignments.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-neutral-100">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-lg font-bold">{completedAssignments.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-neutral-100">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold">{assignments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editing ? 'Edit Assignment' : 'New Assignment'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Title</label>
                <input type="text" placeholder="e.g. Calculus Problem Set #4" className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Subject</label>
                <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Due Date</label>
                <input type="date" className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Description (optional)</label>
                <textarea placeholder="Assignment details..." rows={3} className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.subjectId || !form.dueDate}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Assignment' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
