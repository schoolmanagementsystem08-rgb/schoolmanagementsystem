import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, BookOpen, Search } from 'lucide-react';
import api from '../lib/api.ts';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', specialization: '', phone: '', employeeId: '' });
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<number | null>(null);

  const [assigning, setAssigning] = useState<any>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');

  const loadTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load teachers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeachers(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', specialization: '', phone: '', employeeId: '' });
    setShowForm(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({
      name: t.name || '',
      email: t.email || '',
      specialization: t.specialization || '',
      phone: t.phone || '',
      employeeId: t.employeeId || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/teachers/${editing.id}`, form);
      } else {
        await api.post('/teachers', form);
      }
      setShowForm(false);
      await loadTeachers();
    } catch (err) {
      console.error('Failed to save teacher', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/teachers/${id}`);
      setDeleting(null);
      await loadTeachers();
    } catch (err) {
      console.error('Failed to delete teacher', err);
    }
  };

  const openAssign = async (teacher: any) => {
    setAssigning(teacher);
    setSelectedClass('');
    try {
      const res = await api.get(`/teachers/${teacher.id}/classes/available`);
      setAvailableClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load classes', err);
      setAvailableClasses([]);
    }
  };

  const handleAssign = async () => {
    if (!assigning || !selectedClass) return;
    try {
      await api.put(`/classes/${selectedClass}`, { teacherId: assigning.id });
      setAssigning(null);
      setSelectedClass('');
      await loadTeachers();
    } catch (err) {
      console.error('Failed to assign class', err);
    }
  };

  const handleUnassign = async (classId: number) => {
    try {
      await api.put(`/classes/${classId}`, { teacherId: null });
      await loadTeachers();
    } catch (err) {
      console.error('Failed to unassign class', err);
    }
  };

  const filtered = teachers.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-center text-neutral-400 py-12">Loading teachers...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-neutral-500">Manage teachers and class assignments</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input type="text" placeholder="Search teachers..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-neutral-400 py-12">No teachers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4 text-center">Classes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{t.name}</td>
                    <td className="px-6 py-4 text-neutral-500">{t.email}</td>
                    <td className="px-6 py-4">{t.specialization}</td>
                    <td className="px-6 py-4 text-neutral-500">{t.phone || '-'}</td>
                    <td className="px-6 py-4 text-neutral-500">{t.employeeId || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {t.classCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openAssign(t)}
                          className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600"
                          title="Assign classes">
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(t)}
                          className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-green-600"
                          title="Edit teacher">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleting(t.id)}
                          className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600"
                          title="Delete teacher">
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editing ? 'Edit Teacher' : 'Add Teacher'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Name *</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email *</label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Specialization</label>
                  <input type="text" value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Employee ID</label>
                  <input type="text" value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Phone</label>
                <input type="text" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.email}
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
              <h2 className="text-lg font-bold mb-2">Delete Teacher</h2>
              <p className="text-neutral-500 text-sm">Are you sure? This will also remove their user account.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setDeleting(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={() => handleDelete(deleting)}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">Assign Classes — {assigning.name}</h2>
              <button onClick={() => setAssigning(null)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Select Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white">
                  <option value="">Choose a class...</option>
                  {availableClasses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.academicYear}){c.currentTeacherId ? ' (reassign)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {availableClasses.length === 0 && (
                <p className="text-sm text-neutral-400">No unassigned classes available.</p>
              )}
              <button onClick={handleAssign} disabled={!selectedClass}
                className="w-full bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
