import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, BookOpen, GraduationCap, Calendar, Shield, Eye, ToggleLeft, ToggleRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../lib/api.ts';
import { confirmDelete, toastSuccess, toastError } from '../lib/alerts.ts';

interface Teacher {
  id: number; name: string; email: string; employeeId: string | null;
  specialization: string | null; phone: string | null; status: string;
  portalAccess: string; classCount: number;
}

interface ClassInfo { id: number; name: string; academicYear: string; teacherId: number | null; }
interface SubjectInfo { id: number; name: string; classId: number; className: string | null; teacherId: number | null; }

interface Qualification { degree: string; institution: string; field: string; year: string; }
interface LeaveRequest {
  id: number; teacherId: number; teacherName: string;
  type: string; reason: string; startDate: string; endDate: string;
  status: string; adminNote: string | null; createdAt: string;
}

interface TeacherForm {
  name: string; email: string; employeeId: string; specialization: string; phone: string; status: string;
  qualificationDegree: string; qualificationInstitution: string; qualificationField: string; qualificationYear: string;
}

const emptyForm: TeacherForm = {
  name: '', email: '', employeeId: '', specialization: '', phone: '', status: 'Active',
  qualificationDegree: '', qualificationInstitution: '', qualificationField: '', qualificationYear: '',
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'teachers' | 'leave'>('teachers');
  const [assigning, setAssigning] = useState<Teacher | null>(null);
  const [assignType, setAssignType] = useState<'class' | 'subject'>('class');
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [viewing, setViewing] = useState<Teacher | null>(null);
  const [leaveFilter, setLeaveFilter] = useState('all');

  useEffect(() => { fetchTeachers(); fetchClasses(); fetchSubjects(); fetchLeaveRequests(); }, []);

  const fetchTeachers = async () => {
    try { const res = await api.get('/teachers'); setTeachers(Array.isArray(res.data) ? res.data : []); }
    catch (err) { console.error('Failed to fetch teachers', err); }
    finally { setIsLoading(false); }
  };

  const fetchClasses = async () => {
    try { const res = await api.get('/classes'); setClasses(Array.isArray(res.data) ? res.data : []); }
    catch (err) { console.error('Failed to fetch classes', err); }
  };

  const fetchSubjects = async () => {
    try { const res = await api.get('/subjects'); setSubjects(Array.isArray(res.data) ? res.data : []); }
    catch (err) { console.error('Failed to fetch subjects', err); }
  };

  const fetchLeaveRequests = async () => {
    try {
      const params = leaveFilter !== 'all' ? `?status=${leaveFilter}` : '';
      const res = await api.get(`/leave-requests${params}`);
      setLeaveRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Failed to fetch leave requests', err); }
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      name: t.name, email: t.email, employeeId: t.employeeId || '',
      specialization: t.specialization || '', phone: t.phone || '', status: t.status,
      qualificationDegree: '', qualificationInstitution: '', qualificationField: '', qualificationYear: '',
    });
    setShowModal(true);
  };

  const openAssign = (t: Teacher, type: 'class' | 'subject') => {
    setAssigning(t);
    setAssignType(type);
    if (type === 'class') {
      setSelectedClassIds(classes.filter(c => c.teacherId === t.id).map(c => c.id));
    } else {
      setSelectedSubjectIds(subjects.filter(s => s.teacherId === t.id).map(s => s.id));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const payload: any = {
        name: form.name, email: form.email, employeeId: form.employeeId || null,
        specialization: form.specialization || null, phone: form.phone || null, status: form.status,
      };
      if (form.qualificationDegree) {
        payload.qualification = {
          degree: form.qualificationDegree, institution: form.qualificationInstitution,
          field: form.qualificationField, year: form.qualificationYear,
        };
      }
      if (editing) {
        await api.put(`/teachers/${editing.id}`, payload);
      } else {
        await api.post('/teachers', payload);
      }
      setShowModal(false);
      await fetchTeachers();
    } catch (err) { console.error('Failed to save teacher', err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const result = await confirmDelete('this teacher');
    if (!result.isConfirmed) return;
    try { await api.delete(`/teachers/${id}`); toastSuccess('Teacher deleted'); await fetchTeachers(); }
    catch (err) { toastError('Failed to delete teacher'); console.error(err); }
  };

  const handleAssignSave = async () => {
    if (!assigning) return;
    setAssignSaving(true);
    try {
      if (assignType === 'class') {
        for (const c of classes) {
          const shouldAssign = selectedClassIds.includes(c.id);
          const isAssigned = c.teacherId === assigning.id;
          if (shouldAssign !== isAssigned) {
            await api.put(`/classes/${c.id}`, { teacherId: shouldAssign ? assigning.id : null });
          }
        }
        await fetchClasses();
      } else {
        for (const s of subjects) {
          const shouldAssign = selectedSubjectIds.includes(s.id);
          const isAssigned = s.teacherId === assigning.id;
          if (shouldAssign !== isAssigned) {
            await api.put(`/subjects/${s.id}`, { teacherId: shouldAssign ? assigning.id : null });
          }
        }
        await fetchSubjects();
      }
      setAssigning(null);
      await fetchTeachers();
    } catch (err) { console.error('Failed to assign', err); }
    finally { setAssignSaving(false); }
  };

  const togglePortalAccess = async (t: Teacher) => {
    const newAccess = t.portalAccess === 'full' ? 'restricted' : 'full';
    try {
      await api.put(`/teachers/${t.id}`, { portalAccess: newAccess });
      await fetchTeachers();
    } catch (err) { console.error('Failed to toggle access', err); }
  };

  const approveLeave = async (id: number, status: string) => {
    try { await api.put(`/leave-requests/${id}`, { status }); await fetchLeaveRequests(); }
    catch (err) { console.error('Failed to update leave', err); }
  };

  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { fetchLeaveRequests(); }, [leaveFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
          <p className="text-neutral-500">Manage teachers, subjects, classes, leave requests, and portal access</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('teachers')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'teachers' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
          Teachers
        </button>
        <button onClick={() => setActiveTab('leave')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leave' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
          Leave Requests {leaveRequests.filter(l => l.status === 'Pending').length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-[10px]">{leaveRequests.filter(l => l.status === 'Pending').length}</span>}
        </button>
      </div>

      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="text" placeholder="Search by name, email, ID, or specialization..." className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-sm font-medium">
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3">Classes</th>
                  <th className="px-4 py-3">Subjects</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Portal</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-400">Loading teachers...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-400">{search ? 'No teachers match your search.' : 'No teachers yet.'}</td></tr>
                ) : filtered.map((t) => {
                  const cls = classes.filter(c => c.teacherId === t.id);
                  const subs = subjects.filter(s => s.teacherId === t.id);
                  return (
                    <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 font-bold flex items-center justify-center text-xs text-neutral-500">{t.name?.charAt(0) || '?'}</div>
                          <div>
                            <span className="font-medium text-sm">{t.name}</span>
                            <p className="text-xs text-neutral-400">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 font-mono">{t.employeeId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{t.specialization || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{cls.length}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">{subs.length}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>{t.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => togglePortalAccess(t)} className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${t.portalAccess === 'full' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                          {t.portalAccess === 'full' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {t.portalAccess === 'full' ? 'Full' : 'Restricted'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewing(t)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => openAssign(t, 'class')} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-green-600" title="Assign classes"><GraduationCap className="w-4 h-4" /></button>
                          <button onClick={() => openAssign(t, 'subject')} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-purple-600" title="Assign subjects"><BookOpen className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex gap-2">
            {['all', 'Pending', 'Approved', 'Rejected'].map((s) => (
              <button key={s} onClick={() => setLeaveFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${leaveFilter === s ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-sm font-medium">
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {leaveRequests.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400">No leave requests.</td></tr>
                ) : leaveRequests.map((lr) => (
                  <tr key={lr.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{lr.teacherName}</td>
                    <td className="px-4 py-3 text-sm">{lr.type}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600 max-w-[200px] truncate">{lr.reason}</td>
                    <td className="px-4 py-3 text-sm">{new Date(lr.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">{new Date(lr.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        lr.status === 'Approved' ? 'bg-green-50 text-green-700' :
                        lr.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>{lr.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lr.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => approveLeave(lr.id, 'Approved')} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => approveLeave(lr.id, 'Rejected')} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Reject"><XCircle className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{editing ? 'Edit Teacher' : 'Add Teacher'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Full Name *</label>
                  <input type="text" placeholder="e.g. Mary Akol" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Email *</label>
                  <input type="email" placeholder="e.g. mary@school.edu" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm"
                    value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Employee ID</label>
                  <input type="text" placeholder="e.g. TCH-2026-001" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm"
                    value={form.employeeId} onChange={(e) => setForm({...form, employeeId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Specialization</label>
                  <input type="text" placeholder="e.g. Mathematics" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm"
                    value={form.specialization} onChange={(e) => setForm({...form, specialization: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Phone</label>
                  <input type="text" placeholder="e.g. +211 912 345 678" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm"
                    value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm"
                    value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Qualification (optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Degree</label>
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm"
                      value={form.qualificationDegree} onChange={(e) => setForm({...form, qualificationDegree: e.target.value})}>
                      <option value="">Select...</option>
                      <option value="Bachelor's">Bachelor's</option>
                      <option value="Master's">Master's</option>
                      <option value="PhD">PhD</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Certificate">Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Institution</label>
                    <input type="text" placeholder="e.g. University of Juba" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm"
                      value={form.qualificationInstitution} onChange={(e) => setForm({...form, qualificationInstitution: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Field of Study</label>
                    <input type="text" placeholder="e.g. Education, Mathematics" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm"
                      value={form.qualificationField} onChange={(e) => setForm({...form, qualificationField: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Year</label>
                    <input type="text" placeholder="e.g. 2020" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm"
                      value={form.qualificationYear} onChange={(e) => setForm({...form, qualificationYear: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.email}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Teacher' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Teacher Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Teacher Details</h2>
              <button onClick={() => setViewing(null)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-500">{viewing.name?.charAt(0) || '?'}</div>
                <div>
                  <p className="text-lg font-bold">{viewing.name}</p>
                  <p className="text-sm text-neutral-400">{viewing.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-neutral-400">Employee ID</span><p className="font-mono">{viewing.employeeId || '-'}</p></div>
                <div><span className="text-neutral-400">Specialization</span><p>{viewing.specialization || '-'}</p></div>
                <div><span className="text-neutral-400">Phone</span><p>{viewing.phone || '-'}</p></div>
                <div><span className="text-neutral-400">Status</span><p>{viewing.status}</p></div>
                <div><span className="text-neutral-400">Portal Access</span><p>{viewing.portalAccess === 'full' ? 'Full Access' : 'Restricted'}</p></div>
              </div>
              <div className="border-t border-neutral-100 pt-4">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Classes & Subjects</h3>
                <p className="text-sm text-neutral-600">{classes.filter(c => c.teacherId === viewing.id).length} classes, {subjects.filter(s => s.teacherId === viewing.id).length} subjects</p>
              </div>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setViewing(null)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">
                {assignType === 'class' ? 'Assign Classes' : 'Assign Subjects'} — {assigning.name}
              </h2>
              <button onClick={() => setAssigning(null)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-2 max-h-[50vh] overflow-y-auto">
              {assignType === 'class' ? (
                classes.length === 0 ? <p className="text-sm text-neutral-400">No classes available.</p>
                : classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input type="checkbox" checked={selectedClassIds.includes(c.id)}
                      onChange={() => setSelectedClassIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                      className="w-4 h-4 rounded border-neutral-300" />
                    <div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-neutral-400">{c.academicYear}</p></div>
                  </label>
                ))
              ) : (
                subjects.length === 0 ? <p className="text-sm text-neutral-400">No subjects available.</p>
                : subjects.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input type="checkbox" checked={selectedSubjectIds.includes(s.id)}
                      onChange={() => setSelectedSubjectIds(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                      className="w-4 h-4 rounded border-neutral-300" />
                    <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-neutral-400">{s.className || `Class #${s.classId}`}</p></div>
                  </label>
                ))
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setAssigning(null)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleAssignSave} disabled={assignSaving}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {assignSaving ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
