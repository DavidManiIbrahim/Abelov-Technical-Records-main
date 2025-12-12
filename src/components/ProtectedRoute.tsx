import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Guards routes to logged-in users only
 * Session state comes from backend, restored on app load via AuthContext.me()
 * Never checks localStorage directly
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if no session from backend
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
