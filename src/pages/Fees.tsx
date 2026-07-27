import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Plus, Edit2, Trash2, X, Search, ChevronDown, ChevronUp, Eye, Calendar, Receipt, CheckCircle2, AlertCircle, Building } from 'lucide-react';
import api from '../lib/api.ts';
import { confirmDelete, toastSuccess, toastError } from '../lib/alerts.ts';

interface FeeStructure {
  id: number;
  classId: number;
  className: string | null;
  academicYear: string;
  term: string;
  totalAmount: number;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  studentCount: number;
}

interface StructureDetail extends FeeStructure {
  students: StudentFeeStatus[];
}

interface StudentFeeStatus {
  studentId: number;
  studentName: string;
  studentStudentId: string | null;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  paymentStatus: string;
}

interface Payment {
  id: number;
  studentId: number;
  studentName: string;
  structureId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  referenceNo: string | null;
  notes: string | null;
  recordedBy: number | null;
  createdAt: string;
  academicYear: string | null;
  term: string | null;
}

interface ClassOption {
  id: number;
  name: string;
}

type Tab = 'structures' | 'payments';

export default function FeesPage() {
  const [tab, setTab] = useState<Tab>('structures');
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [structureForm, setStructureForm] = useState({ classId: '', academicYear: '2026-2027', term: 'Term 1', totalAmount: '', description: '', dueDate: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentForm, setPaymentForm] = useState({ studentId: '', structureId: '', amount: '', paymentDate: '', paymentMethod: 'Cash', referenceNo: '', notes: '' });
  const [selectedStructure, setSelectedStructure] = useState<StructureDetail | null>(null);
  const [expandedStructure, setExpandedStructure] = useState<number | null>(null);
  const [students, setStudents] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchStructures();
    api.get('/classes').then(r => setClasses(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/students').then(r => setStudents(Array.isArray(r.data) ? r.data.map((s: any) => ({ id: s.id, name: s.name })) : [])).catch(() => {});
  }, []);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fee-structures');
      setStructures(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fee-payments');
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadStructureDetail = async (id: number) => {
    try {
      const res = await api.get(`/fee-structures/${id}`);
      setSelectedStructure(res.data);
    } catch (err) { toastError('Failed to load structure details'); }
  };

  const handleSaveStructure = async () => {
    if (!structureForm.classId || !structureForm.totalAmount) { toastError('Class and total amount are required'); return; }
    try {
      if (editingStructure) {
        await api.put(`/fee-structures/${editingStructure.id}`, { totalAmount: Number(structureForm.totalAmount), description: structureForm.description, dueDate: structureForm.dueDate || null });
        toastSuccess('Fee structure updated');
      } else {
        await api.post('/fee-structures', { ...structureForm, classId: Number(structureForm.classId), totalAmount: Number(structureForm.totalAmount) });
        toastSuccess('Fee structure created');
      }
      setShowStructureModal(false);
      await fetchStructures();
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed to save fee structure'); }
  };

  const handleSavePayment = async () => {
    if (!paymentForm.studentId || !paymentForm.structureId || !paymentForm.amount) { toastError('Student, structure, and amount are required'); return; }
    try {
      if (editingPayment) {
        await api.put(`/fee-payments/${editingPayment.id}`, { amount: Number(paymentForm.amount), paymentDate: paymentForm.paymentDate, paymentMethod: paymentForm.paymentMethod, referenceNo: paymentForm.referenceNo, notes: paymentForm.notes });
        toastSuccess('Payment updated');
      } else {
        await api.post('/fee-payments', { ...paymentForm, studentId: Number(paymentForm.studentId), structureId: Number(paymentForm.structureId), amount: Number(paymentForm.amount) });
        toastSuccess('Payment recorded');
      }
      setShowPaymentModal(false);
      if (expandedStructure) loadStructureDetail(expandedStructure);
      await fetchPayments();
    } catch (err) { toastError('Failed to save payment'); }
  };

  const handleDeleteStructure = async (id: number) => {
    const result = await confirmDelete('this fee structure and ALL its payment records');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/fee-structures/${id}`);
      toastSuccess('Fee structure deleted');
      setSelectedStructure(null);
      setExpandedStructure(null);
      await fetchStructures();
    } catch (err) { toastError('Failed to delete fee structure'); }
  };

  const handleDeletePayment = async (id: number) => {
    const result = await confirmDelete('this payment record');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/fee-payments/${id}`);
      toastSuccess('Payment deleted');
      if (expandedStructure) loadStructureDetail(expandedStructure);
      await fetchPayments();
    } catch (err) { toastError('Failed to delete payment'); }
  };

  const openAddStructure = () => { setEditingStructure(null); setStructureForm({ classId: '', academicYear: '2026-2027', term: 'Term 1', totalAmount: '', description: '', dueDate: '' }); setShowStructureModal(true); };
  const openEditStructure = (s: FeeStructure) => { setEditingStructure(s); setStructureForm({ classId: String(s.classId), academicYear: s.academicYear, term: s.term, totalAmount: String(s.totalAmount), description: s.description || '', dueDate: s.dueDate ? s.dueDate.slice(0, 10) : '' }); setShowStructureModal(true); };
  const openAddPayment = (structureId?: number) => { setEditingPayment(null); setPaymentForm({ studentId: '', structureId: structureId ? String(structureId) : '', amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'Cash', referenceNo: '', notes: '' }); setShowPaymentModal(true); };
  const openEditPayment = (p: Payment) => { setEditingPayment(p); setPaymentForm({ studentId: String(p.studentId), structureId: String(p.structureId), amount: String(p.amount), paymentDate: p.paymentDate ? p.paymentDate.slice(0, 10) : '', paymentMethod: p.paymentMethod || 'Cash', referenceNo: p.referenceNo || '', notes: p.notes || '' }); setShowPaymentModal(true); };

  const toggleExpand = async (id: number) => {
    if (expandedStructure === id) { setExpandedStructure(null); setSelectedStructure(null); return; }
    setExpandedStructure(id);
    await loadStructureDetail(id);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { Paid: 'bg-green-50 text-green-700', Partial: 'bg-amber-50 text-amber-700', Unpaid: 'bg-red-50 text-red-700' };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-neutral-100 text-neutral-600'}`}>{status}</span>;
  };

  const totalCollected = structures.reduce((a, s) => a + Number(s.totalAmount), 0);
  const structureCount = structures.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-neutral-500 mt-1">Define fee structures and track student payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <Building className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Fee Structures</span>
          </div>
          <p className="text-4xl font-bold">{structureCount}</p>
          <p className="mt-2 text-sm text-neutral-400">Active structures defined</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Total Fees</span>
          </div>
          <p className="text-4xl font-bold">${totalCollected.toLocaleString()}</p>
          <p className="mt-2 text-sm text-neutral-400">Sum of all fee structures</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <Receipt className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Payments</span>
          </div>
          <p className="text-4xl font-bold">{payments.length}</p>
          <p className="mt-2 text-sm text-neutral-400">Individual payments recorded</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-neutral-200">
        <button onClick={() => setTab('structures')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'structures' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>
          <Building className="w-4 h-4 inline mr-1.5" />Fee Structures
        </button>
        <button onClick={() => { setTab('payments'); fetchPayments(); }} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'payments' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>
          <Receipt className="w-4 h-4 inline mr-1.5" />Payment Records
        </button>
      </div>

      {tab === 'structures' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openAddStructure} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
              <Plus className="w-4 h-4" /> Add Fee Structure
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-neutral-400">Loading...</div>
          ) : structures.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-500">No fee structures defined yet.</p>
              <p className="text-sm text-neutral-400 mt-1">Create a fee structure per class, academic year, and term.</p>
            </div>
          ) : structures.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors" onClick={() => toggleExpand(s.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{s.className || `Class #${s.classId}`}</h3>
                    <p className="text-xs text-neutral-400">{s.academicYear} · {s.term} · ${Number(s.totalAmount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">{s.studentCount} students</span>
                  <button onClick={(e) => { e.stopPropagation(); openEditStructure(s); }} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteStructure(s.id); }} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedStructure === s.id ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                </div>
              </div>

              {expandedStructure === s.id && selectedStructure && (
                <div className="border-t border-neutral-100 bg-neutral-50/30">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-sm">Student Payment Status</h4>
                      <button onClick={() => openAddPayment(s.id)} className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                            <th className="text-left px-3 py-2">Student</th>
                            <th className="text-left px-3 py-2">Total Due</th>
                            <th className="text-left px-3 py-2">Total Paid</th>
                            <th className="text-left px-3 py-2">Balance</th>
                            <th className="text-left px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {selectedStructure.students.length === 0 ? (
                            <tr><td colSpan={5} className="px-3 py-6 text-center text-neutral-400 text-xs">No active students in this class</td></tr>
                          ) : selectedStructure.students.map(st => (
                            <tr key={st.studentId}>
                              <td className="px-3 py-2.5">
                                <span className="font-medium">{st.studentName}</span>
                                {st.studentStudentId && <span className="text-xs text-neutral-400 ml-1">({st.studentStudentId})</span>}
                              </td>
                              <td className="px-3 py-2.5 font-mono">${st.totalAmount.toLocaleString()}</td>
                              <td className="px-3 py-2.5 font-mono text-green-600">${st.totalPaid.toLocaleString()}</td>
                              <td className="px-3 py-2.5 font-mono" style={{ color: st.balance > 0 ? '#dc2626' : '#16a34a' }}>${st.balance.toLocaleString()}</td>
                              <td className="px-3 py-2.5">{statusBadge(st.paymentStatus)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 p-5">
                    <h4 className="font-semibold text-sm mb-3">Payment History</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                            <th className="text-left px-3 py-2">Student</th>
                            <th className="text-left px-3 py-2">Amount</th>
                            <th className="text-left px-3 py-2">Date</th>
                            <th className="text-left px-3 py-2">Method</th>
                            <th className="text-left px-3 py-2">Reference</th>
                            <th className="text-right px-3 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {payments.filter(p => p.structureId === s.id).length === 0 ? (
                            <tr><td colSpan={6} className="px-3 py-6 text-center text-neutral-400 text-xs">No payments yet</td></tr>
                          ) : payments.filter(p => p.structureId === s.id).map(p => (
                            <tr key={p.id} className="hover:bg-neutral-50/50">
                              <td className="px-3 py-2 font-medium">{p.studentName}</td>
                              <td className="px-3 py-2 font-mono font-semibold text-green-600">+${Number(p.amount).toLocaleString()}</td>
                              <td className="px-3 py-2 text-neutral-500 text-xs">{new Date(p.paymentDate).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-xs text-neutral-500">{p.paymentMethod || '—'}</td>
                              <td className="px-3 py-2 text-xs text-neutral-400 font-mono">{p.referenceNo || '—'}</td>
                              <td className="px-3 py-2 text-right">
                                <button onClick={() => openEditPayment(p)} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeletePayment(p.id)} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-red-600 ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => openAddPayment()} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-4 text-left">Student</th>
                    <th className="px-5 py-4 text-left">Year/Term</th>
                    <th className="px-5 py-4 text-left">Amount</th>
                    <th className="px-5 py-4 text-left">Date</th>
                    <th className="px-5 py-4 text-left">Method</th>
                    <th className="px-5 py-4 text-left">Reference</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-neutral-400">Loading...</td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-neutral-400">No payments recorded yet</td></tr>
                  ) : payments.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-5 py-4 font-medium">{p.studentName}</td>
                      <td className="px-5 py-4 text-neutral-500">{p.academicYear || '—'} · {p.term || '—'}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-green-600">+${Number(p.amount).toLocaleString()}</td>
                      <td className="px-5 py-4 text-neutral-500 text-xs">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4"><span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">{p.paymentMethod || '—'}</span></td>
                      <td className="px-5 py-4 text-xs text-neutral-400 font-mono">{p.referenceNo || '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => openEditPayment(p)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editingStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}</h2>
              <button onClick={() => setShowStructureModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Class *</label>
                <select value={structureForm.classId} onChange={e => setStructureForm({ ...structureForm, classId: e.target.value })}
                  disabled={!!editingStructure}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 disabled:bg-neutral-50 disabled:text-neutral-400">
                  <option value="">Select class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Academic Year *</label>
                  <select value={structureForm.academicYear} onChange={e => setStructureForm({ ...structureForm, academicYear: e.target.value })}
                    disabled={!!editingStructure}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 disabled:bg-neutral-50 disabled:text-neutral-400">
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Term *</label>
                  <select value={structureForm.term} onChange={e => setStructureForm({ ...structureForm, term: e.target.value })}
                    disabled={!!editingStructure}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 disabled:bg-neutral-50 disabled:text-neutral-400">
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Total Amount ($) *</label>
                <input type="number" min="0" step="0.01" value={structureForm.totalAmount} onChange={e => setStructureForm({ ...structureForm, totalAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Due Date</label>
                <input type="date" value={structureForm.dueDate} onChange={e => setStructureForm({ ...structureForm, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <textarea value={structureForm.description} onChange={e => setStructureForm({ ...structureForm, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none" placeholder="Optional notes about this fee structure" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowStructureModal(false)} className="px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveStructure} className="px-5 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors">
                {editingStructure ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editingPayment ? 'Edit Payment' : 'Record Payment'}</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!editingPayment && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Student *</label>
                    <select value={paymentForm.studentId} onChange={e => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                      <option value="">Select student...</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Fee Structure *</label>
                    <select value={paymentForm.structureId} onChange={e => setPaymentForm({ ...paymentForm, structureId: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                      <option value="">Select structure...</option>
                      {structures.map(s => <option key={s.id} value={s.id}>{s.className || `Class #${s.classId}`} — {s.academicYear} {s.term} (${Number(s.totalAmount).toLocaleString()})</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Amount ($) *</label>
                <input type="number" min="0" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Payment Date</label>
                  <input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Method</label>
                  <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Reference No.</label>
                  <input type="text" value={paymentForm.referenceNo} onChange={e => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                    placeholder="Receipt/transaction ID" className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Notes</label>
                <textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowPaymentModal(false)} className="px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSavePayment} className="px-5 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors">
                {editingPayment ? 'Update' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
