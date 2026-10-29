import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { EventsPage } from './pages/EventsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { CoordinatorDashboard } from './pages/CoordinatorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AccessDeniedPage, NotFoundPage } from './pages/ErrorPages';

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'coordinator') return <Navigate to="/coordinator/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e1a' }}>
        <div style={{ color: '#a5b4fc', fontSize: '1.1rem', fontWeight: 600 }}>Loading CEMS...</div>
      </div>
    );
  }

  // When NOT authenticated: Gate the entire website so only Login / Register portals are shown
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Any other URL immediately redirects to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  // When authenticated: Reveal the full website experience with Navbar, Dashboards, and Footer
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Authenticated user landing & shortcuts */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<HomeRedirect />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/registrations"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyRegistrationsPage />
              </ProtectedRoute>
            }
          />

          {/* Coordinator Protected Routes */}
          <Route
            path="/coordinator/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Administrator Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Global Routes */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
