import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ResumeAnalyzer } from './pages/ResumeAnalyzer';
import { MockInterviewRoom } from './pages/MockInterviewRoom';
import { AptitudePractice } from './pages/AptitudePractice';
import { CodingPractice } from './pages/CodingPractice';
import { CareerGuidance } from './pages/CareerGuidance';
import { PlacementPortal } from './pages/PlacementPortal';
import { StudyPlanner } from './pages/StudyPlanner';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Workspace App Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Student & Shared Features */}
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/resume" element={<ResumeAnalyzer />} />
            <Route path="/interview" element={<MockInterviewRoom />} />
            <Route path="/aptitude" element={<AptitudePractice />} />
            <Route path="/coding" element={<CodingPractice />} />
            <Route path="/career" element={<CareerGuidance />} />
            <Route path="/jobs" element={<PlacementPortal />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
