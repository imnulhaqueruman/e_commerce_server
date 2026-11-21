import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * Gate for pages that require a signed-in user.
 *
 * The `loading` check matters: on a hard refresh the token is in
 * localStorage but the user is not yet loaded, so redirecting on `!token`
 * would bounce a signed-in user to the login page.
 */
export default function ProtectedRoute() {
  const { token, loading } = useAuthStore();
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

  return <Outlet />;
}
