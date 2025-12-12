import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * AdminProtectedRoute - Guards routes to admin users only
 * Admin role comes from backend user object, restored on app load via AuthContext.me()
 * Never checks localStorage directly
 */
export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not admin (role from backend session)
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
