import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'member' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
