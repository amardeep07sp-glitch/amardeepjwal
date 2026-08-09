import { Navigate, Outlet } from 'react-router-dom';
import { PageLoader } from '@/components/global/Loading';
import ForbiddenPage from '@/pages/errors/ForbiddenPage';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isInitializing } = useAuthStore();

  if (isInitializing) {
    return <PageLoader label="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
