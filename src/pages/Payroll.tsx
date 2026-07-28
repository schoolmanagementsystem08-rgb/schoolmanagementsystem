import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, Edit2, Trash2, X, DollarSign, Calendar, CheckCircle2, Download, Ban, Search, ChevronDown, ChevronUp, Users } from 'lucide-react';
import api from '../lib/api.ts';
import { confirmDelete, toastSuccess, toastError } from '../lib/alerts.ts';

interface PayrollRecord {
  id: number;
  teacherId: number;
  teacherName: string;
  employeeId: string | null;
  period: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  bonus: number;
  taxDeduction: number;
  insuranceDeduction: number;
  otherDeduction: number;
  netPay: number;
  paymentDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface TeacherSalary {
  id: number;
  teacherId: number;
  teacherName: string;
  employeeId: string | null;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  taxDeduction: number;
  insuranceDeduction: number;
  otherDeduction: number;
  effectiveDate: string;
  status: string;
  createdAt: string;
}

interface TeacherOption {
  id: number;
  name: string;
  employeeId: string | null;
}

type Tab = 'payroll' | 'salaries';

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function PayrollPage() {
  const [tab, setTab] = useState<Tab>('payroll');
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState<TeacherSalary | null>(null);
  const [salaryForm, setSalaryForm] = useState({ teacherId: '', basicSalary: '', housingAllowance: '', transportAllowance: '', medicalAllowance: '', otherAllowance: '', taxDeduction: '', insuranceDeduction: '', otherDeduction: '', effectiveDate: new Date().toISOString().slice(0, 10) });

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [recordForm, setRecordForm] = useState({ teacherId: '', period: currentPeriod(), basicSalary: '', housingAllowance: '', transportAllowance: '', medicalAllowance: '', otherAllowance: '', bonus: '', taxDeduction: '', insuranceDeduction: '', otherDeduction: '', paymentDate: '', status: 'Draft', notes: '' });

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePeriod, setGeneratePeriod] = useState(currentPeriod());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchPeriods();
  }, []);

  useEffect(() => { fetchRecords(); }, [periodFilter, statusFilter]);
  useEffect(() => { if (tab === 'salaries') fetchSalaries(); }, [tab]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (periodFilter) params.period = periodFilter;
      if (statusFilter) params.status = statusFilter;
      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`/payroll-records${qs ? `?${qs}` : ''}`);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teacher-salaries');
      setSalaries(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(Array.isArray(res.data) ? res.data.map((t: any) => ({ id: t.id, name: t.name, employeeId: t.employeeId })) : []);
    } catch (err) { console.error(err); }
  };

  const fetchPeriods = async () => {
    try {
      const res = await api.get('/payroll-records/periods');
      setAvailablePeriods(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const calcNetPay = (form: typeof recordForm) => {
    const bs = Number(form.basicSalary) || 0;
    const ha = Number(form.housingAllowance) || 0;
    const ta = Number(form.transportAllowance) || 0;
    const ma = Number(form.medicalAllowance) || 0;
    const oa = Number(form.otherAllowance) || 0;
    const b = Number(form.bonus) || 0;
    const tx = Number(form.taxDeduction) || 0;
    const ins = Number(form.insuranceDeduction) || 0;
    const od = Number(form.otherDeduction) || 0;
    return bs + ha + ta + ma + oa + b - tx - ins - od;
  };

  const calcSalaryTotal = (form: typeof salaryForm) => {
    const bs = Number(form.basicSalary) || 0;
    const ha = Number(form.housingAllowance) || 0;
    const ta = Number(form.transportAllowance) || 0;
    const ma = Number(form.medicalAllowance) || 0;
    const oa = Number(form.otherAllowance) || 0;
    const tx = Number(form.taxDeduction) || 0;
    const ins = Number(form.insuranceDeduction) || 0;
    const od = Number(form.otherDeduction) || 0;
    return { gross: bs + ha + ta + ma + oa, deductions: tx + ins + od, net: bs + ha + ta + ma + oa - tx - ins - od };
  };

  const handleSaveSalary = async () => {
    if (!salaryForm.teacherId || !salaryForm.basicSalary) { toastError('Teacher and basic salary are required'); return; }
    try {
      if (editingSalary) {
        await api.put(`/teacher-salaries/${editingSalary.id}`, { ...salaryForm, teacherId: Number(salaryForm.teacherId), basicSalary: Number(salaryForm.basicSalary) });
        toastSuccess('Salary updated');
      } else {
        await api.post('/teacher-salaries', { ...salaryForm, teacherId: Number(salaryForm.teacherId), basicSalary: Number(salaryForm.basicSalary) });
        toastSuccess('Salary created');
      }
      setShowSalaryModal(false);
      await fetchSalaries();
    } catch (err) { toastError('Failed to save salary'); }
  };

  const handleSaveRecord = async () => {
    if (!recordForm.teacherId || !recordForm.basicSalary) { toastError('Teacher and basic salary are required'); return; }
    try {
      const payload = { ...recordForm, teacherId: Number(recordForm.teacherId), basicSalary: Number(recordForm.basicSalary) };
      if (editingRecord) {
        await api.put(`/payroll-records/${editingRecord.id}`, payload);
        toastSuccess('Payroll record updated');
      } else {
        await api.post('/payroll-records', payload);
        toastSuccess('Payroll record created');
      }
      setShowRecordModal(false);
      await fetchRecords();
      await fetchPeriods();
    } catch (err) { toastError('Failed to save payroll record'); }
  };

  const handleGenerate = async () => {
    if (!generatePeriod) { toastError('Select a period'); return; }
    setGenerating(true);
    try {
      await api.post('/payroll-records/generate', { period: generatePeriod });
      toastSuccess(`Payroll generated for ${generatePeriod}`);
      setShowGenerateModal(false);
      await fetchRecords();
      await fetchPeriods();
      setPeriodFilter(generatePeriod);
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed to generate payroll'); }
    setGenerating(false);
  };

  const handleDeleteSalary = async (id: number) => {
    const result = await confirmDelete('this salary structure');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/teacher-salaries/${id}`);
      toastSuccess('Salary deleted');
      await fetchSalaries();
    } catch (err) { toastError('Failed to delete salary'); }
  };

  const handleDeleteRecord = async (id: number) => {
    const result = await confirmDelete('this payroll record');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/payroll-records/${id}`);
      toastSuccess('Payroll record deleted');
      await fetchRecords();
    } catch (err) { toastError('Failed to delete payroll record'); }
  };

  const openAddSalary = () => { setEditingSalary(null); setSalaryForm({ teacherId: '', basicSalary: '', housingAllowance: '', transportAllowance: '', medicalAllowance: '', otherAllowance: '', taxDeduction: '', insuranceDeduction: '', otherDeduction: '', effectiveDate: new Date().toISOString().slice(0, 10) }); setShowSalaryModal(true); };
  const openEditSalary = (s: TeacherSalary) => { setEditingSalary(s); setSalaryForm({ teacherId: String(s.teacherId), basicSalary: String(s.basicSalary), housingAllowance: String(s.housingAllowance), transportAllowance: String(s.transportAllowance), medicalAllowance: String(s.medicalAllowance), otherAllowance: String(s.otherAllowance), taxDeduction: String(s.taxDeduction), insuranceDeduction: String(s.insuranceDeduction), otherDeduction: String(s.otherDeduction), effectiveDate: s.effectiveDate ? s.effectiveDate.slice(0, 10) : '' }); setShowSalaryModal(true); };

  const openAddRecord = (template?: TeacherSalary) => {
    setEditingRecord(null);
    setRecordForm({
      teacherId: template ? String(template.teacherId) : '',
      period: currentPeriod(),
      basicSalary: template ? String(template.basicSalary) : '',
      housingAllowance: template ? String(template.housingAllowance) : '',
      transportAllowance: template ? String(template.transportAllowance) : '',
      medicalAllowance: template ? String(template.medicalAllowance) : '',
      otherAllowance: template ? String(template.otherAllowance) : '',
      bonus: '',
      taxDeduction: template ? String(template.taxDeduction) : '',
      insuranceDeduction: template ? String(template.insuranceDeduction) : '',
      otherDeduction: template ? String(template.otherDeduction) : '',
      paymentDate: '',
      status: 'Draft',
      notes: '',
    });
    setShowRecordModal(true);
  };
  const openEditRecord = (r: PayrollRecord) => {
    setEditingRecord(r);
    setRecordForm({
      teacherId: String(r.teacherId),
      period: r.period,
      basicSalary: String(r.basicSalary),
      housingAllowance: String(r.housingAllowance),
      transportAllowance: String(r.transportAllowance),
      medicalAllowance: String(r.medicalAllowance),
      otherAllowance: String(r.otherAllowance),
      bonus: String(r.bonus),
      taxDeduction: String(r.taxDeduction),
      insuranceDeduction: String(r.insuranceDeduction),
      otherDeduction: String(r.otherDeduction),
      paymentDate: r.paymentDate ? r.paymentDate.slice(0, 10) : '',
      status: r.status,
      notes: r.notes || '',
    });
    setShowRecordModal(true);
  };

  const statusBadge = (status: string) => {
    const c: Record<string, string> = { Paid: 'bg-green-50 text-green-700', Draft: 'bg-amber-50 text-amber-700', Cancelled: 'bg-red-50 text-red-700' };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c[status] || 'bg-neutral-100 text-neutral-600'}`}>{status}</span>;
  };

  const totalNetPay = records.filter(r => r.status === 'Paid').reduce((a, r) => a + Number(r.netPay), 0);
  const totalDraft = records.filter(r => r.status === 'Draft').reduce((a, r) => a + Number(r.netPay), 0);
  const groupPeriod = (r: PayrollRecord) => r.period;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Payroll</h1>
          <p className="text-neutral-500 mt-1">Manage salary structures and monthly payroll</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Total Paid</span>
          </div>
          <p className="text-3xl font-bold text-green-600">${totalNetPay.toLocaleString()}</p>
          <p className="mt-2 text-sm text-neutral-400">{records.filter(r => r.status === 'Paid').length} paid records</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Draft</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">${totalDraft.toLocaleString()}</p>
          <p className="mt-2 text-sm text-neutral-400">{records.filter(r => r.status === 'Draft').length} pending</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Teachers</span>
          </div>
          <p className="text-3xl font-bold">{teachers.length}</p>
          <p className="mt-2 text-sm text-neutral-400">{salaries.filter(s => s.status === 'Active').length} on salary</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <PiggyBank className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Records</span>
          </div>
          <p className="text-3xl font-bold">{records.length}</p>
          <p className="mt-2 text-sm text-neutral-400">{availablePeriods.length} periods</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-neutral-200">
        <button onClick={() => setTab('payroll')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'payroll' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>
          <DollarSign className="w-4 h-4 inline mr-1.5" />Payroll Records
        </button>
        <button onClick={() => setTab('salaries')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'salaries' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>
          <Users className="w-4 h-4 inline mr-1.5" />Salary Structures
        </button>
      </div>

      {tab === 'payroll' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                <option value="">All Periods</option>
                {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors">
                <Download className="w-4 h-4" /> Generate Payroll
              </button>
              <button onClick={() => openAddRecord()} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
                <Plus className="w-4 h-4" /> Add Record
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-4 text-left">Teacher</th>
                    <th className="px-5 py-4 text-left">Period</th>
                    <th className="px-5 py-4 text-left">Basic</th>
                    <th className="px-5 py-4 text-left">Allowances</th>
                    <th className="px-5 py-4 text-left">Deductions</th>
                    <th className="px-5 py-4 text-left">Bonus</th>
                    <th className="px-5 py-4 text-left">Net Pay</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr><td colSpan={9} className="px-5 py-12 text-center text-neutral-400">Loading...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-12 text-center text-neutral-400">
                      <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No payroll records yet. Generate or add manually.</p>
                    </td></tr>
                  ) : records.map(r => (
                    <React.Fragment key={r.id}>
                      <tr className="hover:bg-neutral-50/50 transition-colors cursor-pointer" onClick={() => setExpandedRecord(expandedRecord === r.id ? null : r.id)}>
                        <td className="px-5 py-4">
                          <div className="font-medium">{r.teacherName}</div>
                          {r.employeeId && <div className="text-xs text-neutral-400">{r.employeeId}</div>}
                        </td>
                        <td className="px-5 py-4 text-neutral-500 font-mono text-xs">{r.period}</td>
                        <td className="px-5 py-4 font-mono">${Number(r.basicSalary).toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono text-green-600">+${(Number(r.housingAllowance) + Number(r.transportAllowance) + Number(r.medicalAllowance) + Number(r.otherAllowance)).toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono text-red-500">-${(Number(r.taxDeduction) + Number(r.insuranceDeduction) + Number(r.otherDeduction)).toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono">{Number(r.bonus) > 0 ? <span className="text-green-600">+${Number(r.bonus).toLocaleString()}</span> : '—'}</td>
                        <td className="px-5 py-4 font-mono font-bold">${Number(r.netPay).toLocaleString()}</td>
                        <td className="px-5 py-4">{statusBadge(r.status)}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={(e) => { e.stopPropagation(); openEditRecord(r); }} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(r.id); }} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                      {expandedRecord === r.id && (
                        <tr>
                          <td colSpan={9} className="px-5 py-4 bg-neutral-50/50">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div><span className="text-xs text-neutral-400 block">Basic Salary</span><span className="font-mono">${Number(r.basicSalary).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Housing Allowance</span><span className="font-mono text-green-600">+${Number(r.housingAllowance).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Transport Allowance</span><span className="font-mono text-green-600">+${Number(r.transportAllowance).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Medical Allowance</span><span className="font-mono text-green-600">+${Number(r.medicalAllowance).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Other Allowance</span><span className="font-mono text-green-600">+${Number(r.otherAllowance).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Bonus</span><span className="font-mono text-green-600">+${Number(r.bonus).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Tax Deduction</span><span className="font-mono text-red-500">-${Number(r.taxDeduction).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Insurance</span><span className="font-mono text-red-500">-${Number(r.insuranceDeduction).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Other Deduction</span><span className="font-mono text-red-500">-${Number(r.otherDeduction).toLocaleString()}</span></div>
                              <div><span className="text-xs text-neutral-400 block">Payment Date</span><span>{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '—'}</span></div>
                              {r.notes && <div className="col-span-2"><span className="text-xs text-neutral-400 block">Notes</span><span>{r.notes}</span></div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openAddSalary} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
              <Plus className="w-4 h-4" /> Add Salary
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-4 text-left">Teacher</th>
                    <th className="px-5 py-4 text-left">Basic Salary</th>
                    <th className="px-5 py-4 text-left">Allowances</th>
                    <th className="px-5 py-4 text-left">Deductions</th>
                    <th className="px-5 py-4 text-left">Net</th>
                    <th className="px-5 py-4 text-left">Effective</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-neutral-400">Loading...</td></tr>
                  ) : salaries.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-neutral-400">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No salary structures set up yet.</p>
                    </td></tr>
                  ) : salaries.map(s => {
                    const tot = Number(s.basicSalary) + Number(s.housingAllowance) + Number(s.transportAllowance) + Number(s.medicalAllowance) + Number(s.otherAllowance);
                    const ded = Number(s.taxDeduction) + Number(s.insuranceDeduction) + Number(s.otherDeduction);
                    return (
                      <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium">{s.teacherName}</div>
                          {s.employeeId && <div className="text-xs text-neutral-400">{s.employeeId}</div>}
                        </td>
                        <td className="px-5 py-4 font-mono font-medium">${Number(s.basicSalary).toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono text-green-600">+${tot.toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono text-red-500">-${ded.toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono font-bold">${(tot - ded).toLocaleString()}</td>
                        <td className="px-5 py-4 text-neutral-500 text-xs">{new Date(s.effectiveDate).toLocaleDateString()}</td>
                        <td className="px-5 py-4">{statusBadge(s.status)}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => openEditSalary(s)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600 transition-colors" title="Edit salary"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => openAddRecord(s)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-green-600 transition-colors ml-1" title="Create payroll from this salary"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteSalary(s.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editingSalary ? 'Edit Salary Structure' : 'Add Salary Structure'}</h2>
              <button onClick={() => setShowSalaryModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Teacher *</label>
                <select value={salaryForm.teacherId} onChange={e => setSalaryForm({ ...salaryForm, teacherId: e.target.value })}
                  disabled={!!editingSalary}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 disabled:bg-neutral-50">
                  <option value="">Select teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.employeeId ? `(${t.employeeId})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Basic Salary *</label>
                  <input type="number" min="0" value={salaryForm.basicSalary} onChange={e => setSalaryForm({ ...salaryForm, basicSalary: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Effective Date *</label>
                  <input type="date" value={salaryForm.effectiveDate} onChange={e => setSalaryForm({ ...salaryForm, effectiveDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Allowances</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Housing</label>
                  <input type="number" min="0" value={salaryForm.housingAllowance} onChange={e => setSalaryForm({ ...salaryForm, housingAllowance: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Transport</label>
                  <input type="number" min="0" value={salaryForm.transportAllowance} onChange={e => setSalaryForm({ ...salaryForm, transportAllowance: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Medical</label>
                  <input type="number" min="0" value={salaryForm.medicalAllowance} onChange={e => setSalaryForm({ ...salaryForm, medicalAllowance: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Other</label>
                  <input type="number" min="0" value={salaryForm.otherAllowance} onChange={e => setSalaryForm({ ...salaryForm, otherAllowance: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Deductions</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Tax</label>
                  <input type="number" min="0" value={salaryForm.taxDeduction} onChange={e => setSalaryForm({ ...salaryForm, taxDeduction: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Insurance</label>
                  <input type="number" min="0" value={salaryForm.insuranceDeduction} onChange={e => setSalaryForm({ ...salaryForm, insuranceDeduction: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Other Deductions</label>
                  <input type="number" min="0" value={salaryForm.otherDeduction} onChange={e => setSalaryForm({ ...salaryForm, otherDeduction: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              {salaryForm.basicSalary && (
                <div className="bg-neutral-50 rounded-xl p-4 text-sm">
                  <div className="flex justify-between mb-1"><span>Gross</span><span className="font-mono font-semibold">${calcSalaryTotal(salaryForm).gross.toLocaleString()}</span></div>
                  <div className="flex justify-between mb-1"><span>Total Deductions</span><span className="font-mono text-red-500">-${calcSalaryTotal(salaryForm).deductions.toLocaleString()}</span></div>
                  <div className="flex justify-between border-t border-neutral-200 pt-1"><span className="font-bold">Net</span><span className="font-mono font-bold">${calcSalaryTotal(salaryForm).net.toLocaleString()}</span></div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowSalaryModal(false)} className="px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveSalary} className="px-5 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors">
                {editingSalary ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editingRecord ? 'Edit Payroll Record' : 'Add Payroll Record'}</h2>
              <button onClick={() => setShowRecordModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!editingRecord && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Teacher *</label>
                    <select value={recordForm.teacherId} onChange={e => setRecordForm({ ...recordForm, teacherId: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                      <option value="">Select teacher...</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Period *</label>
                    <input type="month" value={recordForm.period} onChange={e => setRecordForm({ ...recordForm, period: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Basic Salary *</label>
                  <input type="number" min="0" value={recordForm.basicSalary} onChange={e => setRecordForm({ ...recordForm, basicSalary: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Bonus</label>
                  <input type="number" min="0" value={recordForm.bonus} onChange={e => setRecordForm({ ...recordForm, bonus: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Allowances</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-neutral-600 mb-1">Housing</label><input type="number" min="0" value={recordForm.housingAllowance} onChange={e => setRecordForm({ ...recordForm, housingAllowance: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" /></div>
                <div><label className="block text-xs font-medium text-neutral-600 mb-1">Transport</label><input type="number" min="0" value={recordForm.transportAllowance} onChange={e => setRecordForm({ ...recordForm, transportAllowance: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" /></div>
                <div><label className="block text-xs font-medium text-neutral-600 mb-1">Medical</label><input type="number" min="0" value={recordForm.medicalAllowance} onChange={e => setRecordForm({ ...recordForm, medicalAllowance: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" /></div>
                <div><label className="block text-xs font-medium text-neutral-600 mb-1">Other</label><input type="number" min="0" value={recordForm.otherAllowance} onChange={e => setRecordForm({ ...recordForm, otherAllowance: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" /></div>
              </div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Deductions</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-neutral-600 mb-1">Tax</label><input type="number" min="0" value={recordForm.taxDeduction} onChange={e => setRecordForm({ ...recordForm, taxDeduction: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" /></div>
                <div><label className="block text-xs font-medium text-neutral-600 mb-1">Insurance</label><input type="number" min="0" value={recordForm.insuranceDeduction} onChange={e => setRecordForm({ ...recordForm, insuranceDeduction: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" /></div>
                <div><label className="block text-xs font-medium text-neutral-600 mb-1">Other Deductions</label><input type="number" min="0" value={recordForm.otherDeduction} onChange={e => setRecordForm({ ...recordForm, otherDeduction: e.target.value })} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Status</label>
                  <select value={recordForm.status} onChange={e => setRecordForm({ ...recordForm, status: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
                    <option value="Draft">Draft</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Payment Date</label>
                  <input type="date" value={recordForm.paymentDate} onChange={e => setRecordForm({ ...recordForm, paymentDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Notes</label>
                <textarea value={recordForm.notes} onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none" />
              </div>
              {recordForm.basicSalary && (
                <div className="bg-neutral-50 rounded-xl p-4 text-sm">
                  <div className="flex justify-between mb-1"><span>Basic + Allowances + Bonus</span><span className="font-mono font-semibold">${(Number(recordForm.basicSalary) + Number(recordForm.housingAllowance) + Number(recordForm.transportAllowance) + Number(recordForm.medicalAllowance) + Number(recordForm.otherAllowance) + Number(recordForm.bonus)).toLocaleString()}</span></div>
                  <div className="flex justify-between mb-1"><span>Total Deductions</span><span className="font-mono text-red-500">-${(Number(recordForm.taxDeduction) + Number(recordForm.insuranceDeduction) + Number(recordForm.otherDeduction)).toLocaleString()}</span></div>
                  <div className="flex justify-between border-t border-neutral-200 pt-1"><span className="font-bold">Net Pay</span><span className="font-mono font-bold">${calcNetPay(recordForm).toLocaleString()}</span></div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowRecordModal(false)} className="px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveRecord} className="px-5 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors">
                {editingRecord ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <h2 className="text-lg font-bold">Generate Monthly Payroll</h2>
              <button onClick={() => setShowGenerateModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-neutral-500">This will create payroll records for all teachers with active salary structures.</p>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Period</label>
                <input type="month" value={generatePeriod} onChange={e => setGeneratePeriod(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowGenerateModal(false)} className="px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleGenerate} disabled={generating}
                className="px-5 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors">
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
