import React, { useState, useEffect } from 'react';
import {
  Building2, Users, GraduationCap, UserCheck, School, BookOpen,
  DollarSign, CalendarCheck, Clock, Plus, UserPlus, ChevronDown,
  ChevronUp, Search, Filter
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

function OverviewTab() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => {
    api.get('/superadmin/overview').then(r => setStats(r.data)).catch(() => {});
  }, []);

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
          <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <card.icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold truncate">{card.value}</p>
            <p className="text-sm text-neutral-500 truncate">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SchoolsTab() {
  const [data, setData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ name: '', slug: '', domain: '', address: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'admin', schoolId: '' });

  useEffect(() => {
    api.get('/superadmin/schools/detail').then(r => setData(r.data)).catch(() => {});
  }, []);

  const toggleRow = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const createSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/schools', schoolForm);
      setData(prev => [...prev, res.data]);
      setShowSchoolModal(false);
      setSchoolForm({ name: '', slug: '', domain: '', address: '' });
      toastSuccess('School created');
    } catch (err: any) {
      toastError(err.response?.data?.error || 'Failed');
    }
  };

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/invite-user', { ...userForm, schoolId: parseInt(userForm.schoolId) });
      setShowUserModal(false);
      setUserForm({ name: '', email: '', password: '', role: 'admin', schoolId: '' });
      toastSuccess('User created');
    } catch (err: any) {
      toastError(err.response?.data?.error || 'Failed');
    }
  };

  const schools = Array.isArray(data) ? data : [];

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">All Schools</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700">
              <UserPlus className="w-4 h-4" /> Invite User
            </button>
            <button onClick={() => setShowSchoolModal(true)}
              className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800">
              <Plus className="w-4 h-4" /> Add School
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {schools.map(s => (
            <div key={s.id} className="border border-neutral-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleRow(s.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-3">
                  <School className="w-5 h-5 text-neutral-400" />
                  <div>
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-sm text-neutral-400">/{s.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <span>{s.teacherCount || 0} teachers</span>
                  <span>{s.studentCount || 0} students</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{s.status}</span>
                  {expanded.has(s.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {expanded.has(s.id) && (
                <div className="px-4 pb-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-neutral-100 pt-3">
                  <div><span className="text-neutral-400">Admin:</span> {s.adminName || '—'}</div>
                  <div><span className="text-neutral-400">Email:</span> {s.adminEmail || '—'}</div>
                  <div><span className="text-neutral-400">Domain:</span> {s.domain || '—'}</div>
                  <div><span className="text-neutral-400">Address:</span> {s.address || '—'}</div>
                  <div><span className="text-neutral-400">Users:</span> {s.userCount || 0}</div>
                  <div><span className="text-neutral-400">Classes:</span> {s.classCount || 0}</div>
                  <div><span className="text-neutral-400">Created:</span> {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</div>
                  <div><span className="text-neutral-400">ID:</span> {s.id}</div>
                </div>
              )}
            </div>
          ))}
          {schools.length === 0 && (
            <p className="py-8 text-center text-neutral-400">No schools yet</p>
          )}
        </div>
      </div>

      {showSchoolModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowSchoolModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">New School</h2>
            <form onSubmit={createSchool} className="space-y-3">
              <input placeholder="School Name" value={schoolForm.name} onChange={e => setSchoolForm(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required />
              <input placeholder="Slug (auto-filled)" value={schoolForm.slug} onChange={e => setSchoolForm(p => ({ ...p, slug: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required />
              <input placeholder="Custom domain (optional)" value={schoolForm.domain} onChange={e => setSchoolForm(p => ({ ...p, domain: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl" />
              <input placeholder="Address (optional)" value={schoolForm.address} onChange={e => setSchoolForm(p => ({ ...p, address: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowSchoolModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Invite User to School</h2>
            <form onSubmit={inviteUser} className="space-y-3">
              <input placeholder="Full Name" value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl" required />
              <input type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl" required />
              <input type="password" placeholder="Temporary Password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl" required minLength={6} />
              <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl">
                <option value="admin">School Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
              <select value={userForm.schoolId} onChange={e => setUserForm(p => ({ ...p, schoolId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl" required>
                <option value="">Select School</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function UsersTab() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    api.get('/superadmin/users').then(r => setData(r.data)).catch(() => {});
  }, []);

  const users = Array.isArray(data) ? data : [];
  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const roleColors: Record<string, string> = {
    superadmin: 'bg-purple-50 text-purple-700',
    admin: 'bg-blue-50 text-blue-700',
    teacher: 'bg-orange-50 text-orange-700',
    student: 'bg-green-50 text-green-700',
    parent: 'bg-pink-50 text-pink-700',
    developer: 'bg-red-50 text-red-700',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-xl text-sm">
          <option value="">All Roles</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
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
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-neutral-100">
                <td className="py-3 font-medium">{u.name}</td>
                <td className="py-3 text-neutral-500">{u.email}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-neutral-50 text-neutral-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 text-neutral-500">{u.schoolName || '—'}</td>
                <td className="py-3 text-neutral-400 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-neutral-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeachersTab() {
  const [data, setData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/superadmin/teachers').then(r => setData(r.data)).catch(() => {});
  }, []);

  const teachers = Array.isArray(data) ? data : [];
  const filtered = search ? teachers.filter(t => t.name?.toLowerCase().includes(search.toLowerCase())) : teachers;

  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none" />
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
                <div>
                  <span className="font-medium">{t.name}</span>
                  {t.employee_id && <span className="ml-2 text-xs text-neutral-400">ID: {t.employee_id}</span>}
                </div>
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
                  <div><span className="text-neutral-400">Portal Access:</span> {t.portal_access || '—'}</div>
                </div>

                {t.qualifications && t.qualifications.length > 0 && (
                  <div>
                    <p className="font-medium text-neutral-500 mb-1">Qualifications</p>
                    <div className="flex flex-wrap gap-2">
                      {t.qualifications.map((q: any) => (
                        <span key={q.id} className="px-2 py-1 bg-neutral-100 rounded-lg text-xs">
                          {q.degree} in {q.field} — {q.institution} ({q.year})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {t.headClasses && t.headClasses.length > 0 && (
                  <div>
                    <p className="font-medium text-neutral-500 mb-1">Head of Classes</p>
                    <div className="flex flex-wrap gap-2">
                      {t.headClasses.map((c: any) => (
                        <span key={c.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">{c.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {t.subjects && t.subjects.length > 0 && (
                  <div>
                    <p className="font-medium text-neutral-500 mb-1">Assigned Subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {t.subjects.map((sub: any) => (
                        <span key={sub.id} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs">{sub.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {t.salaries && t.salaries.length > 0 && (
                  <div>
                    <p className="font-medium text-neutral-500 mb-1">Salary Records</p>
                    <div className="flex flex-wrap gap-2">
                      {t.salaries.map((ts: any) => (
                        <span key={ts.id} className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs">
                          ${Number(ts.basicSalary).toLocaleString()} ({ts.status})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-neutral-400">No teachers found</p>}
      </div>
    </div>
  );
}

function StudentsTab() {
  const [data, setData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/superadmin/students').then(r => setData(r.data)).catch(() => {});
  }, []);

  const students = Array.isArray(data) ? data : [];
  const filtered = search ? students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase())) : students;

  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm" />
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
                <div>
                  <span className="font-medium">{st.name}</span>
                  {st.student_id && <span className="ml-2 text-xs text-neutral-400">#{st.student_id}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span>{st.className || '—'}</span>
                <span className="text-neutral-400">{st.schoolName}</span>
                {expanded.has(st.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            {expanded.has(st.id) && (
              <div className="px-4 pb-4 text-sm border-t border-neutral-100 pt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><span className="text-neutral-400">Email:</span> {st.email}</div>
                  <div><span className="text-neutral-400">Gender:</span> {st.gender || '—'}</div>
                  <div><span className="text-neutral-400">Status:</span> {st.studentStatus || '—'}</div>
                  <div><span className="text-neutral-400">Enrolled:</span> {st.enrollment_date ? new Date(st.enrollment_date).toLocaleDateString() : '—'}</div>
                </div>
                {st.guardian && st.guardian.id && (
                  <div className="mt-2 p-3 bg-neutral-50 rounded-xl">
                    <p className="font-medium text-neutral-500 mb-1">Guardian</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div><span className="text-neutral-400">Name:</span> {st.guardian.name}</div>
                      <div><span className="text-neutral-400">Phone:</span> {st.guardian.phone || '—'}</div>
                      <div><span className="text-neutral-400">Email:</span> {st.guardian.email || '—'}</div>
                      <div><span className="text-neutral-400">Relationship:</span> {st.guardian.relationship || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-neutral-400">No students found</p>}
      </div>
    </div>
  );
}

function ClassesTab() {
  const [data, setData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/superadmin/classes').then(r => setData(r.data)).catch(() => {});
  }, []);

  const classes = Array.isArray(data) ? data : [];
  const filtered = search ? classes.filter(c => c.name?.toLowerCase().includes(search.toLowerCase())) : classes;

  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm" />
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
                <div>
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-xs text-neutral-400">{c.academic_year}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span>{c.schoolName}</span>
                <span>{c.studentCount || 0} students</span>
                <span>{c.subjectCount || 0} subjects</span>
                {expanded.has(c.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            {expanded.has(c.id) && (
              <div className="px-4 pb-4 border-t border-neutral-100 pt-3">
                <div className="mb-3 text-sm"><span className="text-neutral-400">Head Teacher:</span> {c.headTeacherName || 'Not assigned'}</div>
                {c.subjects && c.subjects.length > 0 && (
                  <div>
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
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-neutral-400">No classes found</p>}
      </div>
    </div>
  );
}

function FinancialTab() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    api.get('/superadmin/financial').then(r => setData(r.data)).catch(() => {});
  }, []);

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
              {schools.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-neutral-400">No financial data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttendanceTab() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    api.get('/superadmin/attendance').then(r => setData(r.data)).catch(() => {});
  }, []);

  const records = Array.isArray(data) ? data : [];
  const statusColors: Record<string, string> = {
    present: 'bg-green-50 text-green-700',
    absent: 'bg-red-50 text-red-700',
    late: 'bg-amber-50 text-amber-700',
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
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-neutral-50 text-neutral-700'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-neutral-400">No attendance records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
