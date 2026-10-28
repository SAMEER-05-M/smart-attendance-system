import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';

// Public Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { UnauthorizedPage } from './pages/common/UnauthorizedPage.js';
import { NotFoundPage } from './pages/common/NotFoundPage.js';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard.js';
import { ScanQrPage } from './pages/student/ScanQrPage.js';
import { FaceAttendancePage } from './pages/student/FaceAttendancePage.js';
import { StudentAttendancePage } from './pages/student/StudentAttendancePage.js';
import { AttendanceHistoryPage } from './pages/student/AttendanceHistoryPage.js';
import { StudentCorrectionsPage } from './pages/student/StudentCorrectionsPage.js';
import { StudentProfilePage } from './pages/student/StudentProfilePage.js';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard.js';
import { FacultySubjectsPage } from './pages/faculty/FacultySubjectsPage.js';
import { StartSessionPage } from './pages/faculty/StartSessionPage.js';
import { LiveSessionPage } from './pages/faculty/LiveSessionPage.js';
import { FacultySessionsPage } from './pages/faculty/FacultySessionsPage.js';
import { FacultyReportsPage } from './pages/faculty/FacultyReportsPage.js';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage.js';
import { AdminFacultyPage } from './pages/admin/AdminFacultyPage.js';
import { AdminAcademicsPage } from './pages/admin/AdminAcademicsPage.js';
import { AdminSectionsPage } from './pages/admin/AdminSectionsPage.js';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.js';
import { AdminCorrectionsPage } from './pages/admin/AdminCorrectionsPage.js';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';

interface ProtectedRouteProps {
  allowedRoles: ('ADMIN' | 'FACULTY' | 'STUDENT')[];
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Authenticated Application Shell */}
          <Route element={<AppLayout />}>
            {/* Student Protected Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/scan"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <ScanQrPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/face-attendance"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <FaceAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/history"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <AttendanceHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/corrections"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentCorrectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Faculty Protected Routes */}
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/subjects"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <FacultySubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/start-session"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <StartSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/session/:id"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <LiveSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/sessions"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <FacultySessionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/reports"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <FacultyReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/corrections"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <AdminCorrectionsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/faculty"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminFacultyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAcademicsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminSectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/corrections"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminCorrectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 Catch All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
export default App;
