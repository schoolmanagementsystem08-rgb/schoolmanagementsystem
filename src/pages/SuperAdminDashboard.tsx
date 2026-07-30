import React, { useState, useEffect } from 'react';
import { Building2, Users, GraduationCap, UserCheck, School, Plus, UserPlus } from 'lucide-react';
import api from '../lib/api';
import { toastSuccess, toastError } from '../lib/alerts';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ totalSchools: 0, totalUsers: 0, totalStudents: 0, totalTeachers: 0, totalClasses: 0 });
  const [schools, setSchools] = useState<any[]>([]);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ name: '', slug: '', domain: '', address: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'admin', schoolId: '' });

  useEffect(() => {
    api.get('/auth/schools').then(r => setSchools(r.data)).catch(() => {});
    api.get('/auth/super-admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const createSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/schools', schoolForm);
      setSchools(prev => [...prev, res.data]);
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
      toastSuccess('User created and invited');
    } catch (err: any) {
      toastError(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Schools', value: stats.totalSchools, icon: Building2, color: 'bg-blue-500' },
          { label: 'Users', value: stats.totalUsers, icon: Users, color: 'bg-green-500' },
          { label: 'Students', value: stats.totalStudents, icon: GraduationCap, color: 'bg-purple-500' },
          { label: 'Teachers', value: stats.totalTeachers, icon: UserCheck, color: 'bg-orange-500' },
          { label: 'Classes', value: stats.totalClasses, icon: School, color: 'bg-teal-500' },
        ].map(card => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-neutral-200 flex items-center gap-4">
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-neutral-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">All Schools</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
              <UserPlus className="w-4 h-4" /> Invite User
            </button>
            <button onClick={() => setShowSchoolModal(true)}
              className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors">
              <Plus className="w-4 h-4" /> Add School
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Slug</th>
                <th className="pb-3 font-medium">Domain</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">ID</th>
              </tr>
            </thead>
            <tbody>
              {schools.map(s => (
                <tr key={s.id} className="border-b border-neutral-100">
                  <td className="py-3 font-medium">{s.name}</td>
                  <td className="py-3 text-neutral-500">{s.slug}</td>
                  <td className="py-3 text-neutral-500">{s.domain || '—'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-neutral-400 text-xs">{s.id}</td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-neutral-400">No schools yet</td></tr>
              )}
            </tbody>
          </table>
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
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
              <input placeholder="Address (optional)" value={schoolForm.address} onChange={e => setSchoolForm(p => ({ ...p, address: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowSchoolModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors">Create</button>
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
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required />
              <input type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required />
              <input type="password" placeholder="Temporary Password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required minLength={6} />
              <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5">
                <option value="admin">School Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
              <select value={userForm.schoolId} onChange={e => setUserForm(p => ({ ...p, schoolId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required>
                <option value="">Select School</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
