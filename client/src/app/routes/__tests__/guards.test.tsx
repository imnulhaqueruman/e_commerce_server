import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/test-utils';
import { useAuthStore } from '@/features/auth/store/authStore';
import ProtectedRoute from '@/app/routes/ProtectedRoute';
import AdminRoute from '@/app/routes/AdminRoute';

/**
 * The route guards decide what a signed-out visitor can reach. The
 * `loading` state matters: on a hard refresh the token is in
 * localStorage but the user has not been fetched yet, so the guard must
 * wait rather than bounce the visitor to the login page.
 */
describe('ProtectedRoute', () => {
  it('renders the outlet for a signed-in user', () => {
    useAuthStore.setState({
      token: 'token',
      user: { _id: '1', email: 'a@b.com', role: 'subscribe' },
      loading: false,
    });

    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<p>Secret content</p>} />
        </Route>
      </Routes>,
      { route: '/secret' },
    );

    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('redirects a signed-out visitor to the login page', () => {
    useAuthStore.setState({ token: null, user: null, loading: false });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<p>Secret content</p>} />
        </Route>
      </Routes>,
      { route: '/secret' },
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('shows a loading state while the session is being validated', () => {
    useAuthStore.setState({ token: 'token', user: null, loading: true });

    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<p>Secret content</p>} />
        </Route>
      </Routes>,
      { route: '/secret' },
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('renders the outlet for an admin', () => {
    useAuthStore.setState({
      token: 'token',
      user: { _id: '1', email: 'a@b.com', role: 'admin' },
      loading: false,
    });

    renderWithProviders(
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<p>Admin content</p>} />
        </Route>
      </Routes>,
      { route: '/admin' },
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('blocks a signed-in non-admin', () => {
    useAuthStore.setState({
      token: 'token',
      user: { _id: '1', email: 'a@b.com', role: 'subscribe' },
      loading: false,
    });

    renderWithProviders(
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<p>Admin content</p>} />
        </Route>
      </Routes>,
      { route: '/admin' },
    );

    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('redirects a signed-out visitor to the login page', () => {
    useAuthStore.setState({ token: null, user: null, loading: false });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<p>Admin content</p>} />
        </Route>
      </Routes>,
      { route: '/admin' },
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
