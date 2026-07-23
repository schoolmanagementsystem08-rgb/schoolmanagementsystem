import React, { useState, useEffect } from 'react';
import { Bell, Megaphone, Calendar, MapPin, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../lib/api.ts';

interface Announcement {
  id: number;
  title: string;
  body: string;
  targetRole: string | null;
  createdAt: string;
}

interface AnnouncementForm {
  title: string;
  body: string;
  targetRole: string;
}

const emptyForm: AnnouncementForm = { title: '', body: '', targetRole: '' };

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body, targetRole: a.targetRole || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.body) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/announcements/${editing.id}`, form);
      } else {
        await api.post('/announcements', form);
      }
      setShowModal(false);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to save announcement', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/announcements/${id}`);
      setDeleting(null);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement', err);
    }
  };

  const getTypeColor = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('sport') || t.includes('event') || t.includes('day')) return 'bg-blue-500';
    if (t.includes('exam') || t.includes('schedule') || t.includes('term')) return 'bg-black';
    return 'bg-green-500';
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements & Events</h1>
          <p className="text-neutral-500">Stay updated with school news and upcoming events</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm">
          <Megaphone className="w-4 h-4" />
          Post Update
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Live Feed
          </h2>
          {isLoading ? (
            <p className="text-center text-neutral-400 py-8">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p className="text-center text-neutral-400 py-8">No announcements yet.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider ${getTypeColor(item.title)}`}>
                      {item.targetRole || 'General'}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-400 font-medium">{formatDate(item.createdAt)}</span>
                      <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleting(item.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-neutral-700 transition-colors">{item.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold mb-6">Upcoming Calendar</h2>
          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="text-xs font-bold text-neutral-400">{d}</span>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg border border-transparent transition-all ${
                  i + 1 === new Date().getDate() ? 'bg-black text-white font-bold shadow-lg' : 'hover:bg-neutral-50 text-neutral-600'
                }`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editing ? 'Edit Announcement' : 'Post Announcement'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Title</label>
                <input type="text" placeholder="e.g. Annual Sports Day 2026" className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Body</label>
                <textarea placeholder="Write your announcement..." rows={4} className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                  value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Target Audience (optional)</label>
                <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="">Everyone</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="parent">Parents</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.body}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="text-lg font-bold mb-2">Delete Announcement</h2>
              <p className="text-neutral-500 text-sm">Are you sure you want to delete this announcement? This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={() => handleDelete(deleting)} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
