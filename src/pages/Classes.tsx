import React, { useState, useEffect } from 'react';
import { Book, User, Calendar, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../lib/api.ts';

interface ClassItem {
  id: number;
  name: string;
  schoolId: number;
  teacherId: number | null;
  teacherName: string | null;
  academicYear: string;
}

interface ClassForm {
  name: string;
  academicYear: string;
  teacherId: string;
}

const emptyForm: ClassForm = { name: '', academicYear: new Date().getFullYear().toString(), teacherId: '' };

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: ClassItem) => {
    setEditing(c);
    setForm({ name: c.name, academicYear: c.academicYear, teacherId: c.teacherId ? String(c.teacherId) : '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.academicYear) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/classes/${editing.id}`, form);
      } else {
        await api.post('/classes', form);
      }
      setShowModal(false);
      await fetchClasses();
    } catch (err) {
      console.error('Failed to save class', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/classes/${id}`);
      setDeleting(null);
      await fetchClasses();
    } catch (err) {
      console.error('Failed to delete class', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-neutral-500">Organize classes, subjects, and teachers</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
          <Plus className="w-4 h-4" />
          Create Class
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-neutral-400 py-12">Loading classes...</p>
      ) : classes.length === 0 ? (
        <p className="text-center text-neutral-400 py-12">No classes created yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-black group-hover:text-white transition-all">
                  <Book className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleting(item.id)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">{item.name}</h3>
              <p className="text-sm text-neutral-500 mb-6 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {item.teacherName || 'No teacher assigned'}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-neutral-100">
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Academic Year</p>
                  <p className="text-lg font-bold">{item.academicYear}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editing ? 'Edit Class' : 'Create Class'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Class Name</label>
                <input type="text" placeholder="e.g. Grade 10A" className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Academic Year</label>
                <input type="text" placeholder="e.g. 2026" className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.academicYear}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="text-lg font-bold mb-2">Delete Class</h2>
              <p className="text-neutral-500 text-sm">Are you sure you want to delete this class? This action cannot be undone.</p>
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
