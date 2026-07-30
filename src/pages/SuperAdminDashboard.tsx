import React, { useState, useEffect } from 'react';
import {
  Building2, Users, GraduationCap, UserCheck, School, BookOpen,
  DollarSign, CalendarCheck, Plus, UserPlus, ChevronDown,
  ChevronUp, Search, Pencil, Trash2, X, Save, Clock
} from 'lucide-react';
import api from '../lib/api';
import { toastSuccess, toastError } from '../lib/alerts';

type Tab = 'overview' | 'schools' | 'users' | 'teachers' | 'students' | 'classes' | 'financial' | 'attendance';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'schools', label: 'Schools', icon: School },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'teachers', label: 'Teachers', icon: UserCheck },
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'classes', label: 'Classes', icon: BookOpen },
  { key: 'financial', label: 'Financial', icon: DollarSign },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-medium transition-colors ${
              activeTab === t.key ? 'bg-black text-white' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'schools' && <SchoolsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'teachers' && <TeachersTab />}
      {activeTab === 'students' && <StudentsTab />}
      {activeTab === 'classes' && <ClassesTab />}
      {activeTab === 'financial' && <FinancialTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 mb-6">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-neutral-500 mb-1">{label}</label>}
      <input className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" {...props} />
    </div>
  );
}

function Select({ label, children, ...props }: any) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-neutral-500 mb-1">{label}</label>}
      <select className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" {...props}>{children}</select>
    </div>
  );
}

// ── Overview ──
function OverviewTab() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => { api.get('/superadmin/overview').then(r => setStats(r.data)).catch(() => {}); }, []);

  const cards = [
    { label: 'Schools', value: stats.totalSchools, icon: Building2, color: 'bg-blue-500' },
    { label: 'Admins', value: stats.totalAdmins, icon: Users, color: 'bg-indigo-500' },
    { label: 'Teachers', value: stats.totalTeachers, icon: UserCheck, color: 'bg-orange-500' },
    { label: 'Students', value: stats.totalStudents, icon: GraduationCap, color: 'bg-purple-500' },
    { label: 'Parents', value: stats.totalParents, icon: Users, color: 'bg-pink-500' },
    { label: 'Classes', value: stats.totalClasses, icon: School, color: 'bg-teal-500' },
    { label: 'Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'bg-cyan-500' },
    { label: 'Fees Collected', value: `$${Number(stats.collectedFees || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Attendance', value: stats.totalAttendance, icon: CalendarCheck, color: 'bg-amber-500' },
    { label: 'Payrolls', value: stats.totalPayrolls, icon: Clock, color: 'bg-rose-500' },
    { label: 'Leave Requests', value: stats.totalLeaves, icon: CalendarCheck, color: 'bg-violet-500' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-slate-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-white p-5 rounded-2xl border border-neutral-200 flex items-center gap-4">
          <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}><card.icon className="w-6 h-6 text-white" /></div>
          <div className="min-w-0"><p className="text-2xl font-bold truncate">{card.value}</p><p className="text-sm text-neutral-500 truncate">{card.label}</p></div>
        </div>
      ))}
    </div>
  );
}

// ── Schools ──
function SchoolsTab() {
  const [data, setData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ name: '', slug: '', domain: '', address: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'admin', schoolId: '' });
  const [editSchool, setEditSchool] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = () => api.get('/superadmin/schools/detail').then(r => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const schools = Array.isArray(data) ? data : [];

  const createSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/schools', schoolForm);
      setData(prev => [...prev, res.data]);
      setShowSchoolModal(false);
      setSchoolForm({ name: '', slug: '', domain: '', address: '' });
      toastSuccess('School created');
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const updateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSchool) return;
    try {
      await api.put(`/auth/schools/${editSchool.id}`, { name: editSchool.name, domain: editSchool.domain, address: editSchool.address, status: editSchool.status });
      toastSuccess('School updated');
      setEditSchool(null);
      load();
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const deleteSchool = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/superadmin/schools/${deleteTarget.id}`); toastSuccess('School deleted'); setDeleteTarget(null); load(); }
    catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/invite-user', { ...userForm, schoolId: parseInt(userForm.schoolId) });
      setShowUserModal(false);
      setUserForm({ name: '', email: '', password: '', role: 'admin', schoolId: '' });
      toastSuccess('User created');
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">All Schools</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowUserModal(true)} className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700"><UserPlus className="w-4 h-4" /> Invite User</button>
            <button onClick={() => setShowSchoolModal(true)} className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800"><Plus className="w-4 h-4" /> Add School</button>
          </div>
        </div>
        <div className="space-y-2">
          {schools.map(s => (
            <div key={s.id} className="border border-neutral-200 rounded-xl overflow-hidden">
              <button onClick={() => { const n = new Set(expanded); n.has(s.id) ? n.delete(s.id) : n.add(s.id); setExpanded(n); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <School className="w-5 h-5 text-neutral-400" />
                  <div><span className="font-medium">{s.name}</span><span className="ml-2 text-sm text-neutral-400">/{s.slug}</span></div>
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <span>{s.teacherCount || 0} teachers</span>
                  <span>{s.studentCount || 0} students</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{s.status}</span>
                  {expanded.has(s.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {expanded.has(s.id) && (
                <div className="px-4 pb-3 border-t border-neutral-100 pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div><span className="text-neutral-400">Admin:</span> {s.adminName || '—'}</div>
                    <div><span className="text-neutral-400">Email:</span> {s.adminEmail || '—'}</div>
                    <div><span className="text-neutral-400">Domain:</span> {s.domain || '—'}</div>
                    <div><span className="text-neutral-400">Address:</span> {s.address || '—'}</div>
                    <div><span className="text-neutral-400">Users:</span> {s.userCount || 0}</div>
                    <div><span className="text-neutral-400">Classes:</span> {s.classCount || 0}</div>
                    <div><span className="text-neutral-400">Created:</span> {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</div>
                    <div><span className="text-neutral-400">ID:</span> {s.id}</div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-neutral-100">
                    <button onClick={() => setEditSchool({ ...s })} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => setDeleteTarget(s)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {schools.length === 0 && <p className="py-8 text-center text-neutral-400">No schools yet</p>}
        </div>
      </div>

      <Modal open={!!editSchool} onClose={() => setEditSchool(null)} title="Edit School">
        <form onSubmit={updateSchool} className="space-y-3">
          <Input label="Name" value={editSchool?.name || ''} onChange={e => setEditSchool((p: any) => ({ ...p, name: e.target.value }))} required />
          <Input label="Domain" value={editSchool?.domain || ''} onChange={e => setEditSchool((p: any) => ({ ...p, domain: e.target.value }))} />
          <Input label="Address" value={editSchool?.address || ''} onChange={e => setEditSchool((p: any) => ({ ...p, address: e.target.value }))} />
          <Select label="Status" value={editSchool?.status || 'active'} onChange={e => setEditSchool((p: any) => ({ ...p, status: e.target.value }))}>
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </Select>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setEditSchool(null)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex items-center justify-center gap-1.5 flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium"><Save className="w-4 h-4" /> Save</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete School" message={`Permanently delete "${deleteTarget?.name}"? All related data remains orphaned.`} onConfirm={deleteSchool} onCancel={() => setDeleteTarget(null)} />

      <Modal open={showSchoolModal} onClose={() => setShowSchoolModal(false)} title="New School">
        <form onSubmit={createSchool} className="space-y-3">
          <Input placeholder="School Name" value={schoolForm.name} onChange={e => setSchoolForm(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} required />
          <Input placeholder="Slug (auto-filled)" value={schoolForm.slug} onChange={e => setSchoolForm(p => ({ ...p, slug: e.target.value }))} required />
          <Input placeholder="Custom domain (optional)" value={schoolForm.domain} onChange={e => setSchoolForm(p => ({ ...p, domain: e.target.value }))} />
          <Input placeholder="Address (optional)" value={schoolForm.address} onChange={e => setSchoolForm(p => ({ ...p, address: e.target.value }))} />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowSchoolModal(false)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title="Invite User to School">
        <form onSubmit={inviteUser} className="space-y-3">
          <Input placeholder="Full Name" value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} required />
          <Input type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} required />
          <Input type="password" placeholder="Temporary Password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
          <Select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
            <option value="admin">School Admin</option><option value="teacher">Teacher</option><option value="student">Student</option><option value="parent">Parent</option>
          </Select>
          <Select value={userForm.schoolId} onChange={e => setUserForm(p => ({ ...p, schoolId: e.target.value }))} required>
            <option value="">Select School</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium">Create User</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ── Users ──
function UsersTab() {
  const [data, setData] = useState<any[]>([]);
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = async () => {
    await Promise.all([
      api.get('/superadmin/users').then(r => setData(r.data)).catch(() => {}),
      api.get('/superadmin/schools/detail').then(r => setSchoolsList(r.data)).catch(() => {}),
    ]);
  };
  useEffect(() => { load(); }, []);

  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await api.put(`/superadmin/users/${editUser.id}`, { name: editUser.name, email: editUser.email, role: editUser.role, schoolId: editUser.school_id || null });
      toastSuccess('User updated'); setEditUser(null); load();
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/superadmin/users/${deleteTarget.id}`); toastSuccess('User deleted'); setDeleteTarget(null); load(); }
    catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const users = Array.isArray(data) ? data : [];
  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search) { const q = search.toLowerCase(); if (!u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false; }
    return true;
  });

  const roleColors: Record<string, string> = {
    superadmin: 'bg-purple-50 text-purple-700', admin: 'bg-blue-50 text-blue-700',
    teacher: 'bg-orange-50 text-orange-700', student: 'bg-green-50 text-green-700',
    parent: 'bg-pink-50 text-pink-700', developer: 'bg-red-50 text-red-700',
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border border-neutral-200 rounded-xl text-sm">
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option><option value="admin">Admin</option><option value="teacher">Teacher</option><option value="student">Student</option><option value="parent">Parent</option>
          </select>
          <span className="text-sm text-neutral-400">{filtered.length} users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">School</th>
                <th className="pb-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-neutral-100">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-neutral-500">{u.email}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-neutral-50 text-neutral-700'}`}>{u.role}</span></td>
                  <td className="py-3 text-neutral-500">{u.schoolName || '—'}</td>
                  <td className="py-3 text-neutral-400 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditUser({ ...u })} className="text-blue-600 hover:text-blue-800"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(u)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-neutral-400">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <form onSubmit={updateUser} className="space-y-3">
          <Input label="Name" value={editUser?.name || ''} onChange={e => setEditUser((p: any) => ({ ...p, name: e.target.value }))} required />
          <Input label="Email" value={editUser?.email || ''} onChange={e => setEditUser((p: any) => ({ ...p, email: e.target.value }))} />
          <Select label="Role" value={editUser?.role || ''} onChange={e => setEditUser((p: any) => ({ ...p, role: e.target.value }))}>
            <option value="">Select role</option>
            <option value="superadmin">Super Admin</option><option value="admin">Admin</option>
            <option value="teacher">Teacher</option><option value="student">Student</option><option value="parent">Parent</option>
          </Select>
          <Select label="School" value={editUser?.school_id || ''} onChange={e => setEditUser((p: any) => ({ ...p, school_id: e.target.value }))}>
            <option value="">None (System-wide)</option>
            {schoolsList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setEditUser(null)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex items-center justify-center gap-1.5 flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium"><Save className="w-4 h-4" /> Save</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete User" message={`Permanently delete "${deleteTarget?.name}"? This also removes their Supabase auth account.`} onConfirm={deleteUser} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}

// ── Teachers ──
function TeachersTab() {
  const [data, setData] = useState<any[]>([]);
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [editTeacher, setEditTeacher] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = async () => {
    await Promise.all([
      api.get('/superadmin/teachers').then(r => setData(r.data)).catch(() => {}),
      api.get('/superadmin/schools/detail').then(r => setSchoolsList(r.data)).catch(() => {}),
    ]);
  };
  useEffect(() => { load(); }, []);

  const updateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher) return;
    try {
      await api.put(`/superadmin/teachers/${editTeacher.id}`, {
        employeeId: editTeacher.employee_id,
        specialization: editTeacher.specialization,
        phone: editTeacher.phone,
        status: editTeacher.status || editTeacher.teacherStatus,
        schoolId: editTeacher.school_id || null,
      });
      toastSuccess('Teacher updated'); setEditTeacher(null); load();
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const deleteTeacher = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/superadmin/teachers/${deleteTarget.id}`); toastSuccess('Teacher deleted'); setDeleteTarget(null); load(); }
    catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const teachers = Array.isArray(data) ? data : [];
  const filtered = search ? teachers.filter(t => t.name?.toLowerCase().includes(search.toLowerCase())) : teachers;

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..." className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm" />
          </div>
          <span className="text-sm text-neutral-400">{filtered.length} teachers</span>
        </div>
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="border border-neutral-200 rounded-xl overflow-hidden">
              <button onClick={() => { const n = new Set(expanded); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); setExpanded(n); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-neutral-400" />
                  <div><span className="font-medium">{t.name}</span>{t.employee_id && <span className="ml-2 text-xs text-neutral-400">ID: {t.employee_id}</span>}</div>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span className="text-neutral-400">{t.schoolName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.teacherStatus === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{t.teacherStatus}</span>
                  {expanded.has(t.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {expanded.has(t.id) && (
                <div className="px-4 pb-4 space-y-3 text-sm border-t border-neutral-100 pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><span className="text-neutral-400">Email:</span> {t.email}</div>
                    <div><span className="text-neutral-400">Specialization:</span> {t.specialization || '—'}</div>
                    <div><span className="text-neutral-400">Phone:</span> {t.phone || '—'}</div>
                    <div><span className="text-neutral-400">Portal:</span> {t.portal_access || '—'}</div>
                  </div>
                  {t.qualifications?.length > 0 && (
                    <div><p className="font-medium text-neutral-500 mb-1">Qualifications</p>
                      <div className="flex flex-wrap gap-2">{t.qualifications.map((q: any) => (
                        <span key={q.id} className="px-2 py-1 bg-neutral-100 rounded-lg text-xs">{q.degree} in {q.field} — {q.institution} ({q.year})</span>
                      ))}</div>
                    </div>
                  )}
                  {t.headClasses?.length > 0 && (
                    <div><p className="font-medium text-neutral-500 mb-1">Head of Classes</p>
                      <div className="flex flex-wrap gap-2">{t.headClasses.map((c: any) => (
                        <span key={c.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">{c.name}</span>
                      ))}</div>
                    </div>
                  )}
                  {t.subjects?.length > 0 && (
                    <div><p className="font-medium text-neutral-500 mb-1">Assigned Subjects</p>
                      <div className="flex flex-wrap gap-2">{t.subjects.map((sub: any) => (
                        <span key={sub.id} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs">{sub.name}</span>
                      ))}</div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-neutral-100">
                    <button onClick={() => setEditTeacher({ ...t })} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => setDeleteTarget(t)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-neutral-400">No teachers found</p>}
        </div>
      </div>

      <Modal open={!!editTeacher} onClose={() => setEditTeacher(null)} title="Edit Teacher">
        <form onSubmit={updateTeacher} className="space-y-3">
          <Input label="Employee ID" value={editTeacher?.employee_id || ''} onChange={e => setEditTeacher((p: any) => ({ ...p, employee_id: e.target.value }))} />
          <Input label="Specialization" value={editTeacher?.specialization || ''} onChange={e => setEditTeacher((p: any) => ({ ...p, specialization: e.target.value }))} />
          <Input label="Phone" value={editTeacher?.phone || ''} onChange={e => setEditTeacher((p: any) => ({ ...p, phone: e.target.value }))} />
          <Select label="Status" value={editTeacher?.status || editTeacher?.teacherStatus || 'Active'} onChange={e => setEditTeacher((p: any) => ({ ...p, status: e.target.value, teacherStatus: e.target.value }))}>
            <option value="Active">Active</option><option value="Inactive">Inactive</option>
          </Select>
          <Select label="School" value={editTeacher?.school_id || ''} onChange={e => setEditTeacher((p: any) => ({ ...p, school_id: e.target.value }))}>
            <option value="">None</option>
            {schoolsList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setEditTeacher(null)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex items-center justify-center gap-1.5 flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium"><Save className="w-4 h-4" /> Save</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Teacher" message={`Permanently delete teacher record for "${deleteTarget?.name}"?`} onConfirm={deleteTeacher} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}

// ── Students ──
function StudentsTab() {
  const [data, setData] = useState<any[]>([]);
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [editStudent, setEditStudent] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = async () => {
    await Promise.all([
      api.get('/superadmin/students').then(r => setData(r.data)).catch(() => {}),
      api.get('/superadmin/schools/detail').then(r => setSchoolsList(r.data)).catch(() => {}),
      api.get('/superadmin/classes').then(r => setClassesList(r.data)).catch(() => {}),
    ]);
  };
  useEffect(() => { load(); }, []);

  const updateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    try {
      const body: any = {
        classId: editStudent.class_id,
        studentId: editStudent.student_id,
        gender: editStudent.gender,
        status: editStudent.status || editStudent.studentStatus,
        schoolId: editStudent.school_id || null,
      };
      if (editStudent.guardianName) {
        body.guardianName = editStudent.guardianName;
        body.guardianPhone = editStudent.guardianPhone;
        body.guardianEmail = editStudent.guardianEmail;
        body.guardianRelationship = editStudent.guardianRelationship;
      }
      await api.put(`/superadmin/students/${editStudent.id}`, body);
      toastSuccess('Student updated'); setEditStudent(null); load();
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const deleteStudent = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/superadmin/students/${deleteTarget.id}`); toastSuccess('Student deleted'); setDeleteTarget(null); load(); }
    catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const students = Array.isArray(data) ? data : [];
  const filtered = search ? students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase())) : students;

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm" />
          </div>
          <span className="text-sm text-neutral-400">{filtered.length} students</span>
        </div>
        <div className="space-y-2">
          {filtered.map(st => (
            <div key={st.id} className="border border-neutral-200 rounded-xl overflow-hidden">
              <button onClick={() => { const n = new Set(expanded); if (n.has(st.id)) n.delete(st.id); else n.add(st.id); setExpanded(n); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-neutral-400" />
                  <div><span className="font-medium">{st.name}</span>{st.student_id && <span className="ml-2 text-xs text-neutral-400">#{st.student_id}</span>}</div>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span>{st.className || '—'}</span>
                  <span className="text-neutral-400">{st.schoolName}</span>
                  {expanded.has(st.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {expanded.has(st.id) && (
                <div className="px-4 pb-4 text-sm border-t border-neutral-100 pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div><span className="text-neutral-400">Email:</span> {st.email}</div>
                    <div><span className="text-neutral-400">Gender:</span> {st.gender || '—'}</div>
                    <div><span className="text-neutral-400">Status:</span> {st.studentStatus || '—'}</div>
                    <div><span className="text-neutral-400">Enrolled:</span> {st.enrollment_date ? new Date(st.enrollment_date).toLocaleDateString() : '—'}</div>
                  </div>
                  {st.guardian?.id && (
                    <div className="p-3 bg-neutral-50 rounded-xl mb-3">
                      <p className="font-medium text-neutral-500 mb-1">Guardian</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><span className="text-neutral-400">Name:</span> {st.guardian.name}</div>
                        <div><span className="text-neutral-400">Phone:</span> {st.guardian.phone || '—'}</div>
                        <div><span className="text-neutral-400">Email:</span> {st.guardian.email || '—'}</div>
                        <div><span className="text-neutral-400">Relation:</span> {st.guardian.relationship || '—'}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-neutral-100">
                    <button onClick={() => setEditStudent({ ...st })} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => setDeleteTarget(st)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-neutral-400">No students found</p>}
        </div>
      </div>

      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student">
        <form onSubmit={updateStudent} className="space-y-3">
          <Input label="Student ID (unique identifier)" value={editStudent?.student_id || ''} onChange={e => setEditStudent((p: any) => ({ ...p, student_id: e.target.value }))} />
          <Select label="School" value={editStudent?.school_id || ''} onChange={e => setEditStudent((p: any) => ({ ...p, school_id: e.target.value }))}>
            <option value="">Select School</option>
            {schoolsList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="Class" value={editStudent?.class_id || ''} onChange={e => setEditStudent((p: any) => ({ ...p, class_id: e.target.value }))}>
            <option value="">Select Class</option>
            {classesList.filter((c: any) => !editStudent?.school_id || c.school_id == editStudent.school_id).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name} ({c.schoolName})</option>
            ))}
          </Select>
          <Select label="Gender" value={editStudent?.gender || ''} onChange={e => setEditStudent((p: any) => ({ ...p, gender: e.target.value }))}>
            <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
          </Select>
          <Select label="Status" value={editStudent?.status || editStudent?.studentStatus || 'Active'} onChange={e => setEditStudent((p: any) => ({ ...p, status: e.target.value, studentStatus: e.target.value }))}>
            <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Graduated">Graduated</option>
          </Select>
          <div className="border-t border-neutral-200 pt-3 mt-3">
            <p className="font-medium text-sm text-neutral-500 mb-2">Guardian Info</p>
            <div className="space-y-3">
              <Input label="Guardian Name" value={editStudent?.guardian?.name || ''} onChange={e => setEditStudent((p: any) => ({ ...p, guardianName: e.target.value }))} />
              <Input label="Guardian Phone" value={editStudent?.guardian?.phone || ''} onChange={e => setEditStudent((p: any) => ({ ...p, guardianPhone: e.target.value }))} />
              <Input label="Guardian Email" value={editStudent?.guardian?.email || ''} onChange={e => setEditStudent((p: any) => ({ ...p, guardianEmail: e.target.value }))} />
              <Select label="Relationship" value={editStudent?.guardian?.relationship || ''} onChange={e => setEditStudent((p: any) => ({ ...p, guardianRelationship: e.target.value }))}>
                <option value="">Select</option><option value="Father">Father</option><option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option><option value="Sibling">Sibling</option><option value="Other">Other</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setEditStudent(null)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex items-center justify-center gap-1.5 flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium"><Save className="w-4 h-4" /> Save</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Student" message={`Permanently delete student record for "${deleteTarget?.name}"?`} onConfirm={deleteStudent} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}

// ── Classes ──
function ClassesTab() {
  const [data, setData] = useState<any[]>([]);
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [editClass, setEditClass] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', schoolId: '', teacherId: '', academicYear: new Date().getFullYear().toString() });

  const load = async () => {
    await Promise.all([
      api.get('/superadmin/classes').then(r => setData(r.data)).catch(() => {}),
      api.get('/superadmin/schools/detail').then(r => setSchoolsList(r.data)).catch(() => {}),
      api.get('/superadmin/teachers').then(r => setTeachersList(r.data)).catch(() => {}),
    ]);
  };
  useEffect(() => { load(); }, []);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/superadmin/classes', addForm);
      toastSuccess('Class created'); setShowAddModal(false);
      setAddForm({ name: '', schoolId: '', teacherId: '', academicYear: new Date().getFullYear().toString() });
      load();
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const updateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClass) return;
    try {
      await api.put(`/superadmin/classes/${editClass.id}`, {
        name: editClass.name,
        schoolId: editClass.schoolId,
        teacherId: editClass.teacherId || null,
        academicYear: editClass.academic_year,
      });
      toastSuccess('Class updated'); setEditClass(null); load();
    } catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const deleteClass = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/superadmin/classes/${deleteTarget.id}`); toastSuccess('Class deleted'); setDeleteTarget(null); load(); }
    catch (err: any) { toastError(err.response?.data?.error || 'Failed'); }
  };

  const classesList = Array.isArray(data) ? data : [];
  const filtered = search ? classesList.filter(c => c.name?.toLowerCase().includes(search.toLowerCase())) : classesList;

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">All Classes</h2>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium"><Plus className="w-4 h-4" /> Add Class</button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..." className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm" />
          </div>
          <span className="text-sm text-neutral-400">{filtered.length} classes</span>
        </div>
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="border border-neutral-200 rounded-xl overflow-hidden">
              <button onClick={() => { const n = new Set(expanded); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); setExpanded(n); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-neutral-400" />
                  <div><span className="font-medium">{c.name}</span><span className="ml-2 text-xs text-neutral-400">{c.academic_year}</span></div>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span>{c.schoolName}</span><span>{c.studentCount || 0} students</span><span>{c.subjectCount || 0} subjects</span>
                  {expanded.has(c.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {expanded.has(c.id) && (
                <div className="px-4 pb-4 border-t border-neutral-100 pt-3">
                  <div className="mb-2 text-sm"><span className="text-neutral-400">Head Teacher:</span> {c.headTeacherName || 'Not assigned'}</div>
                  {c.subjects?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-neutral-500 mb-2">Subjects & Teachers</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {c.subjects.map((sub: any) => (
                          <div key={sub.id} className="p-2 bg-neutral-50 rounded-lg text-sm flex justify-between">
                            <span className="font-medium">{sub.name}</span>
                            <span className="text-neutral-400">{sub.teacherName || 'Unassigned'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-neutral-100">
                    <button onClick={() => setEditClass({ ...c, schoolId: c.school_id, teacherId: c.teacher_id })} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => setDeleteTarget(c)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-neutral-400">No classes found</p>}
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Class">
        <form onSubmit={createClass} className="space-y-3">
          <Input placeholder="Class Name" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required />
          <Select label="School" value={addForm.schoolId} onChange={e => setAddForm(p => ({ ...p, schoolId: e.target.value }))} required>
            <option value="">Select School</option>
            {schoolsList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="Head Teacher (optional)" value={addForm.teacherId} onChange={e => setAddForm(p => ({ ...p, teacherId: e.target.value }))}>
            <option value="">None</option>
            {teachersList.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.schoolName || 'No school'})</option>)}
          </Select>
          <Input placeholder="Academic Year (e.g. 2025/2026)" value={addForm.academicYear} onChange={e => setAddForm(p => ({ ...p, academicYear: e.target.value }))} required />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editClass} onClose={() => setEditClass(null)} title="Edit Class">
        <form onSubmit={updateClass} className="space-y-3">
          <Input label="Name" value={editClass?.name || ''} onChange={e => setEditClass((p: any) => ({ ...p, name: e.target.value }))} required />
          <Select label="School" value={editClass?.schoolId || ''} onChange={e => setEditClass((p: any) => ({ ...p, schoolId: e.target.value }))} required>
            <option value="">Select School</option>
            {schoolsList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="Head Teacher" value={editClass?.teacherId || ''} onChange={e => setEditClass((p: any) => ({ ...p, teacherId: e.target.value }))}>
            <option value="">None</option>
            {teachersList.filter((t: any) => t.school_id == editClass?.schoolId || !editClass?.schoolId).map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Input label="Academic Year" value={editClass?.academic_year || ''} onChange={e => setEditClass((p: any) => ({ ...p, academic_year: e.target.value }))} required />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setEditClass(null)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex items-center justify-center gap-1.5 flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium"><Save className="w-4 h-4" /> Save</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Class" message={`Permanently delete class "${deleteTarget?.name}"?`} onConfirm={deleteClass} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}

// ── Financial ──
function FinancialTab() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => { api.get('/superadmin/financial').then(r => setData(r.data)).catch(() => {}); }, []);

  const schools = Array.isArray(data) ? data : [];
  const totalCollected = schools.reduce((s, x) => s + Number(x.collectedAmount || 0), 0);
  const totalFee = schools.reduce((s, x) => s + Number(x.feeTotal || 0), 0);
  const totalPayroll = schools.reduce((s, x) => s + Number(x.totalPayroll || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Total Fees Set</p>
          <p className="text-2xl font-bold">${totalFee.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">${totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Total Payroll</p>
          <p className="text-2xl font-bold text-orange-600">${totalPayroll.toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <h2 className="text-lg font-bold mb-4">Per-School Financial Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="pb-3 font-medium">School</th>
                <th className="pb-3 font-medium">Fee Records</th>
                <th className="pb-3 font-medium">Total Fees</th>
                <th className="pb-3 font-medium">Collected</th>
                <th className="pb-3 font-medium">Outstanding</th>
                <th className="pb-3 font-medium">Payroll Records</th>
                <th className="pb-3 font-medium">Total Payroll</th>
              </tr>
            </thead>
            <tbody>
              {schools.map(s => {
                const collected = Number(s.collectedAmount || 0);
                const feeTotal = Number(s.feeTotal || 0);
                return (
                  <tr key={s.schoolId} className="border-b border-neutral-100">
                    <td className="py-3 font-medium">{s.schoolName}</td>
                    <td className="py-3">{s.feeRecords || 0}</td>
                    <td className="py-3">${feeTotal.toLocaleString()}</td>
                    <td className="py-3 text-green-600">${collected.toLocaleString()}</td>
                    <td className="py-3 text-red-600">${(feeTotal - collected).toLocaleString()}</td>
                    <td className="py-3">{s.payrollRecords || 0}</td>
                    <td className="py-3">${Number(s.totalPayroll || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
              {schools.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-neutral-400">No financial data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Attendance ──
function AttendanceTab() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => { api.get('/superadmin/attendance').then(r => setData(r.data)).catch(() => {}); }, []);

  const records = Array.isArray(data) ? data : [];
  const statusColors: Record<string, string> = {
    present: 'bg-green-50 text-green-700', absent: 'bg-red-50 text-red-700', late: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200">
      <h2 className="text-lg font-bold mb-4">Attendance Records (Last 500)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="pb-3 font-medium">Student</th>
              <th className="pb-3 font-medium">Class</th>
              <th className="pb-3 font-medium">School</th>
              <th className="pb-3 font-medium">Subject</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b border-neutral-100">
                <td className="py-3 font-medium">{r.studentName}</td>
                <td className="py-3 text-neutral-500">{r.className || '—'}</td>
                <td className="py-3 text-neutral-500">{r.schoolName || '—'}</td>
                <td className="py-3 text-neutral-500">{r.subjectName || '—'}</td>
                <td className="py-3 text-neutral-400 text-xs">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-neutral-50 text-neutral-700'}`}>{r.status}</span></td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-neutral-400">No attendance records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
