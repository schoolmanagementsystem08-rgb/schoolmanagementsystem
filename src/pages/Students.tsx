import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../lib/api.ts';

interface Student {
  id: number;
  name: string;
  email: string;
  classId: number;
  className: string | null;
  enrollmentDate: string;
  status: string;
}

interface ClassOption {
  id: number;
  name: string;
  academicYear: string;
}

interface StudentForm {
  name: string;
  email: string;
  classId: string;
  status: string;
}

const emptyForm: StudentForm = { name: '', email: '', classId: '', status: 'Active' };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({
      name: student.name,
      email: student.email,
      classId: String(student.classId),
      status: student.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.classId) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/students/${editing.id}`, form);
      } else {
        await api.post('/students', form);
      }
      setShowModal(false);
      await fetchStudents();
    } catch (err) {
      console.error('Failed to save student', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/students/${id}`);
      setDeleting(null);
      await fetchStudents();
    } catch (err) {
      console.error('Failed to delete student', err);
    }
  };

  const filteredStudents = (Array.isArray(students) ? students : []).filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-neutral-500">View and manage all enrolled students</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm font-medium">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    {search ? 'No students match your search.' : 'No students enrolled yet.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 font-bold flex items-center justify-center text-xs text-neutral-500">
                          {student.name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{student.email}</td>
                    <td className="px-6 py-4 text-neutral-600">{student.className || `Class #${student.classId}`}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(student)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-blue-600"
                          title="Edit student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(student.id)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-red-600"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editing ? 'Edit Student' : 'Enroll New Student'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Class</label>
                <select
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                >
                  <option value="">Select a class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Status</label>
                <select
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all bg-white"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.email || !form.classId}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editing ? 'Update Student' : 'Enroll Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="text-lg font-bold mb-2">Delete Student</h2>
              <p className="text-neutral-500 text-sm">
                Are you sure you want to delete this student? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
