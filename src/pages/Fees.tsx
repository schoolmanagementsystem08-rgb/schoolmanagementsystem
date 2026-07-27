import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Clock, CheckCircle2, FileText, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../lib/api.ts';
import { confirmDelete, toastSuccess, toastError } from '../lib/alerts.ts';

interface Fee {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  dueDate: string;
  status: string;
  term: string;
}

interface FeeForm {
  studentId: string;
  amount: string;
  dueDate: string;
  status: string;
  term: string;
}

const emptyForm: FeeForm = { studentId: '', amount: '', dueDate: '', status: 'Unpaid', term: 'Term 1' };

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Fee | null>(null);
  const [form, setForm] = useState<FeeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    Promise.all([
      api.get('/fees'),
      api.get('/students'),
    ]).then(([f, s]) => {
      setFees(Array.isArray(f.data) ? f.data : []);
      setStudents(Array.isArray(s.data) ? s.data : []);
    }).catch(err => console.error('Failed to load data', err))
    .finally(() => setIsLoading(false));
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (fee: Fee) => {
    setEditing(fee);
    setForm({
      studentId: String(fee.studentId),
      amount: String(fee.amount),
      dueDate: fee.dueDate ? fee.dueDate.split('T')[0] : '',
      status: fee.status,
      term: fee.term,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.studentId || !form.amount || !form.dueDate || !form.term) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/fees/${editing.id}`, form);
      } else {
        await api.post('/fees', form);
      }
      setShowModal(false);
      const res = await api.get('/fees');
      setFees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to save fee', err);
    } finally {
      setSaving(false);
    }
  };

  const fetchFees = async () => {
    const res = await api.get('/fees');
    setFees(Array.isArray(res.data) ? res.data : []);
  };

  const handleDelete = async (id: number) => {
    const result = await confirmDelete('this fee record');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/fees/${id}`);
      toastSuccess('Fee record deleted');
      await fetchFees();
    } catch (err) { toastError('Failed to delete fee record'); console.error(err); }
  };

  const totalOutstanding = fees.filter(f => f.status !== 'Paid').reduce((a, f) => a + Number(f.amount), 0);
  const totalPaid = fees.filter(f => f.status === 'Paid').reduce((a, f) => a + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-neutral-500">Track balance, invoices, and payment history</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Fee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Total Outstanding</span>
          </div>
          <p className="text-4xl font-bold text-red-600">${totalOutstanding.toLocaleString()}</p>
          <p className="mt-2 text-sm text-neutral-400">{fees.filter(f => f.status !== 'Paid').length} unpaid items</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Total Fees</span>
          </div>
          <p className="text-4xl font-bold">{fees.length}</p>
          <p className="mt-2 text-sm text-neutral-400">Records on file</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium uppercase tracking-wider">Total Paid</span>
          </div>
          <p className="text-4xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
          <p className="mt-2 text-sm text-neutral-400">{fees.filter(f => f.status === 'Paid').length} paid items</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Term</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-neutral-400">Loading fees...</td></tr>
              ) : fees.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-neutral-400">No fees recorded yet.</td></tr>
              ) : (
                fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{fee.studentName}</td>
                    <td className="px-6 py-4 text-neutral-600 font-mono">${Number(fee.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-neutral-500">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        fee.status === 'Paid' ? 'bg-green-50 text-green-700'
                        : fee.status === 'Unpaid' ? 'bg-red-50 text-red-700'
                        : 'bg-orange-50 text-orange-700'
                      }`}>{fee.status}</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{fee.term}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(fee)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(fee.id)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600">
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
              <h2 className="text-lg font-bold">{editing ? 'Edit Fee' : 'Add Fee'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Student</label>
                <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="">Select student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Amount ($)</label>
                <input type="number" placeholder="0.00" className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Due Date</label>
                <input type="date" className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/5">
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Term</label>
                  <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/5">
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.studentId || !form.amount || !form.dueDate}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Fee' : 'Add Fee'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
