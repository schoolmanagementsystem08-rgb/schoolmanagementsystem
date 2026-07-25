import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, X, Users, Save } from 'lucide-react';
import api from '../lib/api.ts';

const allPermissions = [
  { key: 'students:view', label: 'View Students' },
  { key: 'students:create', label: 'Create Students' },
  { key: 'students:edit', label: 'Edit Students' },
  { key: 'students:delete', label: 'Delete Students' },
  { key: 'teachers:view', label: 'View Teachers' },
  { key: 'teachers:create', label: 'Create Teachers' },
  { key: 'teachers:edit', label: 'Edit Teachers' },
  { key: 'teachers:delete', label: 'Delete Teachers' },
  { key: 'classes:view', label: 'View Classes' },
  { key: 'classes:create', label: 'Create Classes' },
  { key: 'classes:edit', label: 'Edit Classes' },
  { key: 'classes:delete', label: 'Delete Classes' },
  { key: 'attendance:view', label: 'View Attendance' },
  { key: 'attendance:create', label: 'Mark Attendance' },
  { key: 'attendance:edit', label: 'Edit Attendance' },
  { key: 'grades:view', label: 'View Grades' },
  { key: 'grades:create', label: 'Create Grades' },
  { key: 'grades:edit', label: 'Edit Grades' },
  { key: 'fees:view', label: 'View Fees' },
  { key: 'fees:create', label: 'Create Fees' },
  { key: 'fees:edit', label: 'Edit Fees' },
  { key: 'announcements:view', label: 'View Announcements' },
  { key: 'announcements:create', label: 'Create Announcements' },
  { key: 'messages:send', label: 'Send Messages' },
  { key: 'settings:view', label: 'View Settings' },
  { key: 'settings:edit', label: 'Edit Settings' },
  { key: 'users:view', label: 'View Users' },
  { key: 'users:edit', label: 'Edit Users' },
  { key: 'users:delete', label: 'Delete Users' },
  { key: 'roles:manage', label: 'Manage Roles' },
];

export default function RolesPage() {
  const [roleList, setRoleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const loadRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoleList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setSelectedPerms(new Set());
    setShowForm(true);
  };

  const openEdit = (role: any) => {
    setEditing(role);
    setForm({ name: role.name, description: role.description || '' });
    setSelectedPerms(new Set(Array.isArray(role.permissions) ? role.permissions : []));
    setShowForm(true);
  };

  const togglePerm = (key: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = { ...form, permissions: Array.from(selectedPerms) };
      if (editing) {
        await api.put(`/roles/${editing.id}`, payload);
      } else {
        await api.post('/roles', payload);
      }
      setShowForm(false);
      await loadRoles();
    } catch (err) {
      console.error('Failed to save role', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center text-neutral-400 py-12">Loading roles...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-neutral-500">Define roles and their access permissions</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roleList.map((role) => (
          <div key={role.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h3 className="font-bold capitalize">{role.name}</h3>
                  <p className="text-xs text-neutral-400">{role.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {role.userCount} users
                </span>
                <button onClick={() => openEdit(role)}
                  className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                  role.permissions.slice(0, 8).map((p: string) => (
                    <span key={p} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-medium">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400">No specific permissions</span>
                )}
                {Array.isArray(role.permissions) && role.permissions.length > 8 && (
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-400 text-xs font-medium">
                    +{role.permissions.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{editing ? 'Edit Role' : 'Add Role'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Role Name *</label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={editing?.isSystem}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50 disabled:text-neutral-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Description</label>
                  <input type="text" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allPermissions.map((perm) => (
                    <label key={perm.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                        selectedPerms.has(perm.key)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                      }`}>
                      <input type="checkbox" checked={selectedPerms.has(perm.key)}
                        onChange={() => togglePerm(perm.key)}
                        className="sr-only" />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        selectedPerms.has(perm.key) ? 'bg-white' : 'bg-white border-neutral-300'
                      }`}>
                        {selectedPerms.has(perm.key) && (
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-medium">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
