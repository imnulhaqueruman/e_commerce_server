import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function AdminRoute() {
  const { token, user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view the admin dashboard.
        </p>
      </div>
    );
  }

  return <Outlet />;
}