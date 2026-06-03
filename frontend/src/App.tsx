import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import useAuthStore from './stores/useAuthStore';

import PublicLayout from './layouts/PublicLayout';
import MemberLayout from './layouts/MemberLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CoachDetailPage from './pages/CoachDetailPage';

// Member pages
import MemberDashboard from './pages/member/Dashboard';
import MemberCourses from './pages/member/Courses';
import MemberCourseDetail from './pages/member/CourseDetail';
import MemberBookings from './pages/member/Bookings';
import MemberCoaches from './pages/member/Coaches';
import MemberCoachDetail from './pages/member/CoachDetail';
import MemberCheckin from './pages/member/Checkin';
import MemberAchievements from './pages/member/Achievements';
import MemberAIAssistant from './pages/member/AIAssistant';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCoaches from './pages/admin/Coaches';
import AdminCourses from './pages/admin/Courses';
import AdminBookings from './pages/admin/Bookings';
import AdminAchievements from './pages/admin/Achievements';
import AdminTransactions from './pages/admin/Transactions';
import AdminHomepage from './pages/admin/Homepage';

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/coaches/:id" element={<CoachDetailPage />} />
      </Route>

      {/* Member routes */}
      <Route
        element={
          <ProtectedRoute>
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/member/courses" element={<MemberCourses />} />
        <Route path="/member/courses/:id" element={<MemberCourseDetail />} />
        <Route path="/member/bookings" element={<MemberBookings />} />
        <Route path="/member/coaches" element={<MemberCoaches />} />
        <Route path="/member/coaches/:id" element={<MemberCoachDetail />} />
        <Route path="/member/checkin" element={<MemberCheckin />} />
        <Route path="/member/achievements" element={<MemberAchievements />} />
        <Route path="/member/ai-assistant" element={<MemberAIAssistant />} />
      </Route>

      {/* Admin routes */}
      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/coaches" element={<AdminCoaches />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/achievements" element={<AdminAchievements />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/homepage" element={<AdminHomepage />} />
      </Route>
    </Routes>
  );
}
