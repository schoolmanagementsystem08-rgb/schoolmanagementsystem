import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Trash2, X, Check } from 'lucide-react';
import api from '../lib/api.ts';
import { confirmDelete, toastSuccess, toastError } from '../lib/alerts.ts';

const roleOptions = ['admin', 'teacher', 'student', 'parent'];

export default function UsersPage() {
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingRole, setEditingRole] = useState<{ id: number; role: string } | null>(null);

  const loadUsers = async () => {
    try {
      const params: any = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;
      const res = await api.get('/admin/users', { params });
      setUserList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  useEffect(() => {
    if (!search) return;
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRoleChange = async () => {
    if (!editingRole) return;
    try {
      await api.put(`/admin/users/${editingRole.id}/role`, { role: editingRole.role });
      setEditingRole(null);
      await loadUsers();
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await confirmDelete('this user');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toastSuccess('User deleted');
      await loadUsers();
    } catch (err) { toastError('Failed to delete user'); console.error(err); }
  };

  const filtered = userList.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-center text-neutral-400 py-12">Loading users...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-neutral-500">Manage system users, roles, and permissions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-xl bg-white">
          <option value="all">All Roles</option>
          {roleOptions.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}s</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-neutral-400 py-12">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{u.name}</td>
                    <td className="px-6 py-4 text-neutral-500">{u.email}</td>
                    <td className="px-6 py-4">
                      {editingRole?.id === u.id ? (
                        <div className="flex items-center gap-2">
                          <select value={editingRole.role}
                            onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value })}
                            className="px-2 py-1 border border-neutral-200 rounded-lg text-sm bg-white">
                            {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={handleRoleChange}
                            className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingRole(null)}
                            className="p-1 text-neutral-400 hover:bg-neutral-100 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingRole({ id: u.id, role: u.role })}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors">
                          {u.role}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(u.id)}
                        className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
