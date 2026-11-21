import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * Gate for admin-only pages.
 *
 * The role comes from the `User` document (`role === 'admin'`), which the
 * server checks independently on every admin endpoint — this guard is a
 * UX affordance, not the security boundary.
 */
export default function AdminRoute() {
  const { token, user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Loading…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container flex h-[60vh] flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This area is for administrators. Your account does not have admin
          access.
        </p>
        <a
          href="/"
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Back to the shop
        </a>
      </div>
    );
  }

  return <Outlet />;
}
