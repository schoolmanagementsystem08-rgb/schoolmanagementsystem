import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Eye, User, DollarSign, Award } from 'lucide-react';
import api from '../lib/api.ts';
import { TableSkeleton } from '../components/Skeletons.tsx';

interface Guardian {
  name: string; phone: string; email: string; address: string; relationship: string;
}

interface Student {
  id: number; studentId: string | null; name: string; email: string; gender: string | null;
  classId: number; className: string | null; academicYear: string | null;
  teacherName: string | null;
  enrollmentDate: string; status: string;
  guardianId: number | null; guardianName: string | null; guardianPhone: string | null;
  guardianEmail: string | null; guardianRelationship: string | null;
  balance: string;
  scholarship: { name: string; discount: number; type: string } | null;
}

interface FeeRecord {
  id: number; amount: number; dueDate: string; status: string; term: string;
}

interface ClassOption {
  id: number; name: string; academicYear: string;
}

interface StudentForm {
  name: string; email: string; gender: string;
  classId: string; status: string;
  guardianName: string; guardianPhone: string; guardianEmail: string;
  guardianAddress: string; guardianRelationship: string;
}

const emptyForm: StudentForm = {
  name: '', email: '', gender: '', classId: '', status: 'Active',
  guardianName: '', guardianPhone: '', guardianEmail: '',
  guardianAddress: '', guardianRelationship: '',
};

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
  const [viewing, setViewing] = useState<Student | null>(null);
  const [feeHistory, setFeeHistory] = useState<FeeRecord[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);

  useEffect(() => { fetchStudents(); fetchClasses(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Failed to fetch students', err); }
    finally { setIsLoading(false); }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Failed to fetch classes', err); }
  };

  const fetchFeeHistory = async (studentId: number) => {
    setLoadingFees(true);
    try {
      const res = await api.get(`/students/${studentId}/fees`);
      setFeeHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Failed to fetch fee history', err); }
    finally { setLoadingFees(false); }
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({
      name: student.name, email: student.email, gender: student.gender || '',
      classId: String(student.classId), status: student.status,
      guardianName: student.guardianName || '', guardianPhone: student.guardianPhone || '',
      guardianEmail: student.guardianEmail || '', guardianAddress: '',
      guardianRelationship: student.guardianRelationship || '',
    });
    setShowModal(true);
  };

  const openView = (student: Student) => {
    setViewing(student);
    fetchFeeHistory(student.id);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.classId) return;
    setSaving(true);
    try {
      const payload: any = {
        name: form.name, email: form.email, classId: form.classId,
        gender: form.gender || null, status: form.status,
      };
      if (form.guardianName) {
        payload.guardian = {
          name: form.guardianName,
          phone: form.guardianPhone || null,
          email: form.guardianEmail || null,
          address: form.guardianAddress || null,
          relationship: form.guardianRelationship || null,
        };
      } else {
        payload.guardian = null;
      }
      if (editing) {
        await api.put(`/students/${editing.id}`, payload);
      } else {
        await api.post('/students', payload);
      }
      setShowModal(false);
      await fetchStudents();
    } catch (err) { console.error('Failed to save student', err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/students/${id}`);
      setDeleting(null);
      await fetchStudents();
    } catch (err) { console.error('Failed to delete student', err); }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-neutral-500">View and manage all enrolled students</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors">
          <Plus className="w-4 h-4" /> Enroll Student
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="Search by name, ID, or email..." className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm font-medium">
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Head Teacher</th>
                <th className="px-4 py-3">Guardian</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Scholarship</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-4"><TableSkeleton rows={5} cols={7} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-neutral-400">
                  {search ? 'No students match your search.' : 'No students enrolled yet.'}
                </td></tr>
              ) : filtered.map((s) => {
                const bal = Number(s.balance);
                return (
                  <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{s.studentId || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 font-bold flex items-center justify-center text-xs text-neutral-500">
                          {s.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <span className="font-medium text-sm">{s.name}</span>
                          <p className="text-xs text-neutral-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{s.gender || '-'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{s.className || `#${s.classId}`}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{s.teacherName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{s.guardianName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {bal > 0 ? `$${bal.toLocaleString()}` : '$0'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.scholarship ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                          <Award className="w-3 h-3" />
                          {s.scholarship.discount}%
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openView(s)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600" title="Edit student">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleting(s.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600" title="Delete student">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{editing ? 'Edit Student' : 'Enroll New Student'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Full Name *</label>
                  <input type="text" placeholder="e.g. John Deng" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Email *</label>
                  <input type="email" placeholder="e.g. john@school.edu" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Gender</label>
                  <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}>
                    <option value="">Select gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Class *</label>
                  <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.classId} onChange={(e) => setForm({...form, classId: e.target.value})}>
                    <option value="">Select class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Transferred">Transferred</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <h3 className="text-sm font-bold text-neutral-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Guardian / Parent Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Full Name</label>
                    <input type="text" placeholder="e.g. Akol Deng" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={form.guardianName} onChange={(e) => setForm({...form, guardianName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Phone</label>
                    <input type="text" placeholder="e.g. +211 912 345 678" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={form.guardianPhone} onChange={(e) => setForm({...form, guardianPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Email</label>
                    <input type="email" placeholder="e.g. akol@example.com" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={form.guardianEmail} onChange={(e) => setForm({...form, guardianEmail: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Relationship</label>
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={form.guardianRelationship} onChange={(e) => setForm({...form, guardianRelationship: e.target.value})}>
                      <option value="">Select...</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Address</label>
                    <input type="text" placeholder="e.g. Hai Malakal, Juba" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={form.guardianAddress} onChange={(e) => setForm({...form, guardianAddress: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.email || !form.classId}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Student' : 'Enroll Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Student Details</h2>
              <button onClick={() => { setViewing(null); setFeeHistory([]); }} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-500">
                  {viewing.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-lg font-bold">{viewing.name}</p>
                  <p className="text-sm text-neutral-400">{viewing.studentId || 'No ID assigned'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div><span className="text-neutral-400">Email</span><p>{viewing.email}</p></div>
                  <div><span className="text-neutral-400">Gender</span><p>{viewing.gender || '-'}</p></div>
                  <div><span className="text-neutral-400">Class</span><p>{viewing.className || `#${viewing.classId}`}</p></div>
                  <div><span className="text-neutral-400">Head Teacher</span><p>{viewing.teacherName || '-'}</p></div>
                  <div><span className="text-neutral-400">Academic Year</span><p>{viewing.academicYear || '-'}</p></div>
                  <div><span className="text-neutral-400">Enrolled</span><p>{new Date(viewing.enrollmentDate).toLocaleDateString()}</p></div>
                </div>
                <div className="space-y-3">
                  <div><span className="text-neutral-400">Status</span>
                    <p><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${viewing.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>{viewing.status}</span></p>
                  </div>
                  <div><span className="text-neutral-400">Outstanding Balance</span>
                    <p className={`font-bold ${Number(viewing.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${Number(viewing.balance).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {(viewing.guardianName) && (
                <div className="border-t border-neutral-100 pt-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Guardian</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-neutral-400">Name</span><p>{viewing.guardianName}</p></div>
                    {viewing.guardianPhone && <div><span className="text-neutral-400">Phone</span><p>{viewing.guardianPhone}</p></div>}
                    {viewing.guardianEmail && <div><span className="text-neutral-400">Email</span><p>{viewing.guardianEmail}</p></div>}
                    {viewing.guardianRelationship && <div><span className="text-neutral-400">Relationship</span><p>{viewing.guardianRelationship}</p></div>}
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-100 pt-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Fee History</h3>
                {loadingFees ? (
                  <p className="text-sm text-neutral-400">Loading fees...</p>
                ) : feeHistory.length === 0 ? (
                  <p className="text-sm text-neutral-400">No fee records found.</p>
                ) : (
                  <div className="space-y-2">
                    {feeHistory.map((f) => (
                      <div key={f.id} className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">${f.amount.toLocaleString()}</span>
                          <span className="text-neutral-400">{f.term}</span>
                          <span className="text-neutral-400">{new Date(f.dueDate).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          f.status === 'Paid' ? 'bg-green-50 text-green-700' :
                          f.status === 'Unpaid' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                        }`}>{f.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => { setViewing(null); setFeeHistory([]); }} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

      {deleting !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-center mb-2">Delete Student</h2>
              <p className="text-neutral-500 text-sm text-center">
                This will permanently delete the student, their user account, and all associated data. This action <strong>cannot</strong> be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={() => handleDelete(deleting)} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-sm">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
