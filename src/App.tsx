import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { AuthProvider, useAuth } from './lib/useAuth.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SignupPage from './pages/SignupPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import StudentsPage from './pages/Students.tsx';
import AttendancePage from './pages/Attendance.tsx';
import GradesPage from './pages/Grades.tsx';
import FeesPage from './pages/Fees.tsx';
import MessagesPage from './pages/Messages.tsx';
import AnnouncementsPage from './pages/Announcements.tsx';
import ClassesPage from './pages/Classes.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.tsx';
import TeachersPage from './pages/Teachers.tsx';
import RolesPage from './pages/Roles.tsx';
import UsersPage from './pages/Users.tsx';
import ExaminationsPage from './pages/Examinations.tsx';
import TimetablesPage from './pages/Timetables.tsx';
import HomeworkPage from './pages/Homework.tsx';
import LibraryPage from './pages/Library.tsx';
import InventoryPage from './pages/Inventory.tsx';
import TransportPage from './pages/Transport.tsx';
import PayrollPage from './pages/Payroll.tsx';
import DeletedRecordsPage from './pages/DeletedRecords.tsx';
import ScholarshipsPage from './pages/Scholarships.tsx';
import SystemLogsPage from './pages/SystemLogs.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { usePageTracking } from './lib/useActivityLog.ts';
import api from './lib/api.ts';


import TeacherDashboard from './pages/TeacherDashboard.tsx';
import TeacherClasses from './pages/TeacherClasses.tsx';
import TeacherGrades from './pages/TeacherGrades.tsx';
import TeacherAttendance from './pages/TeacherAttendance.tsx';
import TeacherReports from './pages/TeacherReports.tsx';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut, role } = useAuth();
  const [schoolName, setSchoolName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

      <div className="bg-white p-8 rounded-2xl border border-neutral-200">
        <h2 className="text-lg font-bold mb-4">Session Management</h2>
        <p className="text-sm text-neutral-500 mb-4">Sign out from all active sessions across all devices.</p>
        <button onClick={async () => {
          setSigningOut(true);
          try {
            await api.post('/auth/sign-out-all');
            await signOut();
          } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to sign out all sessions');
            setSigningOut(false);
          }
        }} disabled={signingOut}
          className="bg-red-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors text-sm disabled:opacity-50">
          {signingOut ? 'Signing out...' : 'Sign Out of All Devices'}
        </button>
      </div>

      {role !== 'superadmin' && (
        <div className="bg-white p-8 rounded-2xl border border-neutral-200">
          <h2 className="text-lg font-bold mb-4">Role Elevation</h2>
          <p className="text-sm text-neutral-500 mb-4">Elevate your account to access more features.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={async () => {
              try {
                const res = await api.post('/auth/make-me-developer');
                alert(res.data.message);
                window.location.reload();
              } catch (err: any) {
                alert(err.response?.data?.error || 'Failed');
              }
            }} className="bg-neutral-900 text-white px-6 py-2 rounded-xl font-medium hover:bg-neutral-700 transition-colors text-sm">
              Make Me Developer
            </button>
            <button onClick={async () => {
              try {
                const res = await api.post('/auth/make-me-superadmin');
                alert(res.data.message);
                window.location.reload();
              } catch (err: any) {
                alert(err.response?.data?.error || 'Failed');
              }
            }} className="bg-purple-700 text-white px-6 py-2 rounded-xl font-medium hover:bg-purple-800 transition-colors text-sm">
              Make Me Super Admin
            </button>
          </div>
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

  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const isSuperAdmin = role === 'superadmin';
  const isTeacher = role === 'teacher';

  usePageTracking();

  return (
    <DashboardLayout userRole={role}>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={isSuperAdmin ? <SuperAdminDashboard /> : isTeacher ? <TeacherDashboard /> : <AdminDashboard />} />
        {isSuperAdmin && (
          <Route path="/schools" element={<SuperAdminDashboard />} />
        )}
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/examinations" element={<ExaminationsPage />} />
        <Route path="/timetables" element={<TimetablesPage />} />
        <Route path="/homework" element={<HomeworkPage />} />

        {(role === 'admin' || role === 'developer') && (
          <>
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/transport" element={<TransportPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/deleted-records" element={<DeletedRecordsPage />} />
            <Route path="/scholarships" element={<ScholarshipsPage />} />
          </>
        )}
        {role === 'developer' && (
          <Route path="/system-logs" element={<SystemLogsPage />} />
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
      </ErrorBoundary>
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
