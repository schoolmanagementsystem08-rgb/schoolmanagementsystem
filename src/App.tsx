import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { AuthProvider, useAuth } from './lib/useAuth.tsx';
import api from './lib/api.ts';

import LoginPage from './pages/LoginPage.tsx';
import SignupPage from './pages/SignupPage.tsx';
import StudentsPage from './pages/Students.tsx';
import AttendancePage from './pages/Attendance.tsx';
import GradesPage from './pages/Grades.tsx';
import FeesPage from './pages/Fees.tsx';
import MessagesPage from './pages/Messages.tsx';
import AnnouncementsPage from './pages/Announcements.tsx';
import ClassesPage from './pages/Classes.tsx';

import TeacherDashboard from './pages/TeacherDashboard.tsx';
import TeacherClasses from './pages/TeacherClasses.tsx';
import TeacherGrades from './pages/TeacherGrades.tsx';
import TeacherAttendance from './pages/TeacherAttendance.tsx';
import TeacherReports from './pages/TeacherReports.tsx';

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
      setStats({
        students: students.length,
        fees: fees.filter((f: any) => f.status !== 'Paid').reduce((a: number, f: any) => a + Number(f.amount), 0),
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
              <div className={`mt-2 px-2 py-0.5 rounded-full text-xs font-semibold inline-block ${stat.color}`}>{stat.change}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 animate-pulse">N</div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const isTeacher = role === 'teacher';

  return (
    <DashboardLayout userRole={role}>
      <Routes>
        <Route path="/" element={isTeacher ? <TeacherDashboard /> : <Dashboard />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {role === 'admin' && (
          <>
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/fees" element={<FeesPage />} />
          </>
        )}

        {role === 'teacher' && (
          <>
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/grades" element={<TeacherGrades />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/reports" element={<TeacherReports />} />
          </>
        )}

        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/signup" element={<Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
