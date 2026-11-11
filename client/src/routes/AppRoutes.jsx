import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import InternsPage from '../pages/admin/InternsPage';
import InternDetailPage from '../pages/admin/InternDetailPage';
import TasksPage from '../pages/admin/TasksPage';
import SubmissionsPage from '../pages/admin/SubmissionsPage';
import InternDashboardPage from '../pages/intern/InternDashboardPage';
import InternTasksPage from '../pages/intern/InternTasksPage';
import InternTaskDetailPage from '../pages/intern/InternTaskDetailPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import { FullPageLoader } from '../components/ui/Spinner';
import { ROLE_HOME } from '../utils/constants';

function HomeRedirect() {
  const { isAuthenticated, initializing, user } = useAuth();

  if (initializing) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />

        <Route element={<RoleRoute role="admin" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/interns" element={<InternsPage />} />
          <Route path="/admin/interns/:id" element={<InternDetailPage />} />
          <Route path="/admin/tasks" element={<TasksPage />} />
          <Route path="/admin/submissions" element={<SubmissionsPage />} />
        </Route>

        <Route element={<RoleRoute role="intern" />}>
          <Route path="/intern" element={<InternDashboardPage />} />
          <Route path="/intern/tasks" element={<InternTasksPage />} />
          <Route path="/intern/tasks/:id" element={<InternTaskDetailPage />} />
        </Route>
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
