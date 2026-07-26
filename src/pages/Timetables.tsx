import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Clock, User, BookOpen, MapPin, AlertTriangle } from 'lucide-react';
import api from '../lib/api.ts';

interface TimetableEntry {
  id: number; classId: number; className: string;
  subjectId: number; subjectName: string;
  teacherId: number; teacherName: string;
  dayOfWeek: number; startTime: string; endTime: string;
  room: string | null; term: string | null;
}

interface ClassOption {
  id: number; name: string; academicYear: string;
}

interface SubjectOption {
  id: number; name: string; classId: number;
}

interface TeacherOption {
  id: number; name: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function toTime(str: string) {
  if (!str) return '';
  const [h, m] = str.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am - 6pm

export default function TimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TimetableEntry | null>(null);
  const [form, setForm] = useState({ classId: '', subjectId: '', teacherId: '', dayOfWeek: '0', startTime: '', endTime: '', room: '', term: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [eRes, cRes, sRes, tRes] = await Promise.all([
        api.get('/timetable'),
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/teachers'),
      ]);
      setEntries(Array.isArray(eRes.data) ? eRes.data : []);
      setClasses(Array.isArray(cRes.data) ? cRes.data : []);
      setSubjects(Array.isArray(sRes.data) ? sRes.data : []);
      setTeachers(Array.isArray(tRes.data) ? tRes.data.map((t: any) => ({ id: t.id, name: t.name })) : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = selectedClass ? entries.filter(e => e.classId === Number(selectedClass)) : entries;

  const getSlot = (day: number, hour: number) => {
    const start = hour * 60;
    const end = start + 60;
    return filtered.find(e => e.dayOfWeek === day && timeToMinutes(e.startTime) >= start && timeToMinutes(e.startTime) < end);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ classId: '', subjectId: '', teacherId: '', dayOfWeek: '0', startTime: '', endTime: '', room: '', term: '' });
    setShowModal(true);
  };

  const openEdit = (e: TimetableEntry) => {
    setEditing(e);
    setForm({
      classId: String(e.classId), subjectId: String(e.subjectId), teacherId: String(e.teacherId),
      dayOfWeek: String(e.dayOfWeek), startTime: e.startTime, endTime: e.endTime,
      room: e.room || '', term: e.term || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.classId || !form.subjectId || !form.teacherId || !form.startTime || !form.endTime) return;
    setSaving(true);
    try {
      const body = { ...form, classId: Number(form.classId), subjectId: Number(form.subjectId), teacherId: Number(form.teacherId), dayOfWeek: Number(form.dayOfWeek) };
      if (editing) {
        await api.put(`/timetable/${editing.id}`, body);
      } else {
        await api.post('/timetable', body);
      }
      setShowModal(false);
      await fetchAll();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this timetable entry?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      await fetchAll();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-neutral-500">Schedule classes, subjects, and time slots</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-neutral-400 py-12">Loading timetable...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-neutral-400 py-12">No timetable entries yet. Add a slot to get started.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-3 py-3 text-left font-semibold text-neutral-500 min-w-[70px]">Time</th>
                {DAYS.map((d, i) => (
                  <th key={i} className="px-3 py-3 text-left font-semibold text-neutral-500 min-w-[140px]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {HOURS.map((hour) => (
                <tr key={hour} className="hover:bg-neutral-50/50">
                  <td className="px-3 py-2 text-xs font-mono text-neutral-400 align-top whitespace-nowrap">{toTime(`${hour}:00`)}</td>
                  {DAYS.map((_, day) => {
                    const slot = getSlot(day, hour);
                    return (
                      <td key={day} className="px-2 py-1 align-top border-l border-neutral-100">
                        {slot ? (
                          <div className="group relative bg-blue-50 rounded-lg p-2 border border-blue-100 hover:shadow-sm transition-all">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-blue-800 truncate">{slot.subjectName}</p>
                                <p className="text-[10px] text-blue-600 truncate">{slot.teacherName}</p>
                                <div className="flex items-center gap-1 text-[10px] text-blue-500 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {toTime(slot.startTime)} - {toTime(slot.endTime)}
                                </div>
                                {slot.room && (
                                  <div className="flex items-center gap-1 text-[10px] text-blue-500 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {slot.room}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={() => openEdit(slot)} className="p-1 hover:bg-blue-100 rounded text-blue-600">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDelete(slot.id)} className="p-1 hover:bg-red-100 rounded text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">{editing ? 'Edit Slot' : 'Add Timetable Slot'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Class</label>
                  <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.classId} onChange={(e) => setForm({...form, classId: e.target.value})}>
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Subject</label>
                  <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.subjectId} onChange={(e) => setForm({...form, subjectId: e.target.value})}>
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Teacher</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.teacherId} onChange={(e) => setForm({...form, teacherId: e.target.value})}>
                  <option value="">Select teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Day</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={form.dayOfWeek} onChange={(e) => setForm({...form, dayOfWeek: e.target.value})}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Start Time</label>
                  <input type="time" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">End Time</label>
                  <input type="time" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Room (optional)</label>
                  <input type="text" placeholder="e.g. Room 201" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.room} onChange={(e) => setForm({...form, room: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Term (optional)</label>
                  <input type="text" placeholder="e.g. Term 1" className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={form.term} onChange={(e) => setForm({...form, term: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.classId || !form.subjectId || !form.teacherId || !form.startTime || !form.endTime}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Slot' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
