import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Award, X } from 'lucide-react';
import api from '../lib/api.ts';
import { confirmDelete, toastSuccess, toastError } from '../lib/alerts.ts';

interface Scholarship {
  id: number;
  studentId: number;
  scholarshipName: string;
  type: string;
  discountPercentage: number;
  amount: number | null;
  startDate: string;
  endDate: string | null;
  status: string;
  notes: string | null;
  approvedBy: number | null;
  createdAt: string;
  studentName: string | null;
  studentStudentId: string | null;
  className: string | null;
}

interface StudentOption {
  id: number;
  name: string;
  studentId: string | null;
  className: string | null;
}

interface ScholarshipForm {
  studentId: string;
  scholarshipName: string;
  type: string;
  discountPercentage: string;
  amount: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
}

const emptyForm: ScholarshipForm = {
  studentId: '',
  scholarshipName: '',
  type: 'partial',
  discountPercentage: '',
  amount: '',
  startDate: '',
  endDate: '',
  status: 'Active',
  notes: '',
};

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Scholarship | null>(null);
  const [form, setForm] = useState<ScholarshipForm>(emptyForm);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchScholarships(); fetchStudents(); }, []);

  const fetchScholarships = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`/scholarships${qs ? `?${qs}` : ''}`);
      setScholarships(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch scholarships', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      const data: StudentOption[] = Array.isArray(res.data) ? res.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        studentId: s.studentId,
        className: s.className,
      })) : [];
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  useEffect(() => { fetchScholarships(); }, [filterStatus, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: Scholarship) => {
    setEditing(s);
    setForm({
      studentId: String(s.studentId),
      scholarshipName: s.scholarshipName,
      type: s.type,
      discountPercentage: String(s.discountPercentage),
      amount: s.amount ? String(s.amount) : '',
      startDate: s.startDate ? s.startDate.slice(0, 10) : '',
      endDate: s.endDate ? s.endDate.slice(0, 10) : '',
      status: s.status,
      notes: s.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.studentId || !form.scholarshipName || !form.startDate) {
      toastError('Student, scholarship name, and start date are required');
      return;
    }
    try {
      const payload = {
        studentId: Number(form.studentId),
        scholarshipName: form.scholarshipName,
        type: form.type,
        discountPercentage: Number(form.discountPercentage) || 0,
        amount: form.amount ? Number(form.amount) : null,
        startDate: form.startDate,
        endDate: form.endDate || null,
        status: form.status,
        notes: form.notes || null,
      };
      if (editing) {
        await api.put(`/scholarships/${editing.id}`, payload);
        toastSuccess('Scholarship updated');
      } else {
        await api.post('/scholarships', payload);
        toastSuccess('Scholarship created');
      }
      setShowModal(false);
      await fetchScholarships();
    } catch (err) { toastError('Failed to save scholarship'); console.error(err); }
  };

  const handleDelete = async (id: number) => {
    const result = await confirmDelete('this scholarship');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/scholarships/${id}`);
      toastSuccess('Scholarship deleted');
      await fetchScholarships();
    } catch (err) { toastError('Failed to delete scholarship'); console.error(err); }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-green-100 text-green-800',
      Expired: 'bg-neutral-100 text-neutral-500',
      Suspended: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-neutral-100 text-neutral-600'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scholarships</h1>
          <p className="text-neutral-500 mt-1">Manage student scholarship records</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
          <Plus className="w-4 h-4" /> Add Scholarship
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search by student name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="text-left px-6 py-4 font-semibold text-neutral-600">Student</th>
                <th className="text-left px-6 py-4 font-semibold text-neutral-600">Class</th>
                <th className="text-left px-6 py-4 font-semibold text-neutral-600">Scholarship</th>
                <th className="text-left px-6 py-4 font-semibold text-neutral-600">Type</th>
                <th className="text-left px-6 py-4 font-semibold text-neutral-600">Discount</th>
                <th className="text-left px-6 py-4 font-semibold text-neutral-600">Period</th>
                <th className="text-left px-6 py-4 font-semibold text-neutral-600">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scholarships.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                    <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No scholarship records yet</p>
                  </td>
                </tr>
              ) : scholarships.map(s => (
                <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{s.studentName || '—'}</div>
                    {s.studentStudentId && <div className="text-xs text-neutral-400">{s.studentStudentId}</div>}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{s.className || '—'}</td>
                  <td className="px-6 py-4 font-medium">{s.scholarshipName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.type === 'full' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{s.discountPercentage}%</td>
                  <td className="px-6 py-4 text-neutral-600 text-xs">
                    <div>{formatDate(s.startDate)}</div>
                    {s.endDate && <div className="text-neutral-400">→ {formatDate(s.endDate)}</div>}
                  </td>
                  <td className="px-6 py-4">{statusBadge(s.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600 transition-colors ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editing ? 'Edit Scholarship' : 'Add Scholarship'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Student *</label>
                <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.studentId ? `(${s.studentId})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Scholarship Name *</label>
                <input type="text" value={form.scholarshipName} onChange={e => setForm({ ...form, scholarshipName: e.target.value })}
                  placeholder="e.g. Merit Scholarship" className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                    <option value="partial">Partial</option>
                    <option value="full">Full</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Discount % *</label>
                  <input type="number" min="0" max="100" value={form.discountPercentage} onChange={e => setForm({ ...form, discountPercentage: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Amount (optional)</label>
                <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="Fixed amount if applicable" className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3} className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors">
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
