import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { FoglampHUD } from "foglamp/hud";
import api from './lib/api.ts';

import StudentsPage from './pages/Students.tsx';
import AttendancePage from './pages/Attendance.tsx';
import GradesPage from './pages/Grades.tsx';
import FeesPage from './pages/Fees.tsx';
import MessagesPage from './pages/Messages.tsx';
import AssignmentsPage from './pages/Assignments.tsx';
import AnnouncementsPage from './pages/Announcements.tsx';
import ClassesPage from './pages/Classes.tsx';

import TeacherDashboard from './pages/TeacherDashboard.tsx';
import TeacherClasses from './pages/TeacherClasses.tsx';
import TeacherGrades from './pages/TeacherGrades.tsx';
import TeacherAttendance from './pages/TeacherAttendance.tsx';
import TeacherReports from './pages/TeacherReports.tsx';

const roles = [
  { id: 'admin', label: 'Admin', desc: 'Full system access' },
  { id: 'teacher', label: 'Teacher', desc: 'Manage classes, grades, attendance' },
  { id: 'student', label: 'Student', desc: 'View grades and assignments' },
  { id: 'parent', label: 'Parent', desc: 'Monitor student progress' },
];

function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [teacherName, setTeacherName] = useState('');

  const handleLogin = () => {
    localStorage.setItem('role', selectedRole);
    if (selectedRole === 'teacher') {
      const teacherId = localStorage.getItem('teacherId') || '1';
      const name = teacherName || 'Teacher';
      localStorage.setItem('userName', name);
      localStorage.setItem('teacherId', teacherId);
    } else if (selectedRole === 'admin') {
      localStorage.setItem('userName', 'Admin User');
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden">
        <div className="p-8 text-center border-b border-neutral-100">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">N</div>
          <h1 className="text-2xl font-bold">NexusEdu</h1>
          <p className="text-neutral-500 text-sm mt-1">School Management System</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Select Role</label>
            <div className="space-y-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedRole === r.id
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <p className="font-bold">{r.label}</p>
                  <p className={`text-xs ${selectedRole === r.id ? 'text-white/70' : 'text-neutral-500'}`}>{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedRole === 'teacher' && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Your Name</label>
              <input
                type="text"
                placeholder="e.g. John Smith"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

const SettingsPage = () => {
  const [schoolName, setSchoolName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSchoolName(localStorage.getItem('schoolName') || 'NexusEdu Academy');
    setAcademicYear(localStorage.getItem('academicYear') || '2026-2027');
  }, []);

  const handleSave = () => {
    localStorage.setItem('schoolName', schoolName);
    localStorage.setItem('academicYear', academicYear);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
      <div className="bg-white p-8 rounded-2xl border border-neutral-200">
        <p className="text-neutral-500">School Profile & Configuration</p>
        <div className="mt-6 space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-bold mb-2">School Name</label>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Academic Year</label>
            <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5">
              <option>2025-2026</option>
              <option>2026-2027</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave}
              className="bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
              Save Settings
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ students: 0, fees: 0, announcements: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/students').catch(() => ({ data: [] })),
      api.get('/fees').catch(() => ({ data: [] })),
      api.get('/announcements').catch(() => ({ data: [] })),
    ]).then(([studentsRes, feesRes, announcementsRes]) => {
      const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const fees = Array.isArray(feesRes.data) ? feesRes.data : [];
      const announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data : [];
      const unpaidFees = fees.filter((f: any) => f.status !== 'Paid');
      setStats({
        students: students.length,
        fees: unpaidFees.reduce((a: number, f: any) => a + Number(f.amount), 0),
        announcements: announcements.length,
        attendanceRate: 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="text-sm text-neutral-500">Term: Spring 2026</div>
      </div>

      {loading ? (
        <p className="text-center text-neutral-400 py-12">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Students', value: String(stats.students), change: 'Enrolled', color: 'bg-blue-50 text-blue-700' },
              { label: 'Announcements', value: String(stats.announcements), change: 'Posted', color: 'bg-green-50 text-green-700' },
              { label: 'Active Fee Records', value: String(stats.fees > 0 ? stats.fees : 0), change: 'Outstanding', color: 'bg-orange-50 text-orange-700' },
              { label: 'Unpaid Fees', value: `$${stats.fees.toLocaleString()}`, change: 'Due', color: 'bg-purple-50 text-purple-700' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <div className={`mt-2 px-2 py-0.5 rounded-full text-xs font-semibold inline-block ${stat.color}`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Academic Performance</h2>
              <div className="h-64 flex items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
                <p className="text-sm">[ Performance Chart ]</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Quick Summary</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-500">Total Students</span>
                  <span className="font-bold">{stats.students}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-500">Announcements</span>
                  <span className="font-bold">{stats.announcements}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-500">Unpaid Fees</span>
                  <span className="font-bold text-red-600">${stats.fees.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const role = localStorage.getItem('role') || 'admin';
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}

export default function App() {
  const [role, setRole] = React.useState(localStorage.getItem('role') || '');

  useEffect(() => {
    const checkRole = () => setRole(localStorage.getItem('role') || '');
    window.addEventListener('storage', checkRole);
    return () => window.removeEventListener('storage', checkRole);
  }, []);

  if (!role) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <DashboardLayout userRole={role}>
        <Routes>
          {/* Admin routes */}
          <Route path="/" element={
            role === 'teacher' ? <TeacherDashboard /> : <Dashboard />
          } />
          <Route path="/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentsPage /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute allowedRoles={['admin']}><ClassesPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin']}><AttendancePage /></ProtectedRoute>} />
          <Route path="/grades" element={<ProtectedRoute allowedRoles={['admin']}><GradesPage /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute allowedRoles={['admin']}><AssignmentsPage /></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute allowedRoles={['admin']}><FeesPage /></ProtectedRoute>} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Teacher routes */}
          <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
          <Route path="/teacher/grades" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherGrades /></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
          <Route path="/teacher/reports" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherReports /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </DashboardLayout>
      {import.meta.env.DEV && <FoglampHUD />}
    </Router>
  );
}
