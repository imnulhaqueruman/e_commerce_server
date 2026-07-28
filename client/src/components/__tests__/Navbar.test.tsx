import { describe, it, expect } from 'vitest';
import {
  renderWithProviders,
  screen,
  within,
  waitFor,
} from '@/test/test-utils';
import { Navbar } from '../Navbar';
import { useAuthStore } from '@/store/authStore';
import { apiMock } from '@/test/setup-globals-helpers';

describe('<Navbar />', () => {
  it('shows the brand and the Sign-in link when logged out', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText(/^Shopper$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
    // No admin link when logged out.
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
  });

  it('hides Sign-in and shows Account + Log out when a token is set', () => {
    useAuthStore.setState({ token: 'fake-token', user: null });

    // Provide wishlist/cart empty responses.
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/user/cart') return Promise.resolve({ data: { products: [] } });
      if (url === '/user/wishlist') return Promise.resolve({ data: { wishlist: [] } });
      return Promise.resolve({ data: null });
    });

    renderWithProviders(<Navbar />);
    expect(
      screen.getByRole('button', { name: /log out/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /account/i }),
    ).toHaveAttribute('href', '/user');
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('shows the Admin link when the user has admin role', async () => {
    useAuthStore.setState({
      token: 'fake-token',
      user: {
        _id: 'u1',
        email: 'a@b.c',
        name: 'Admin',
        role: 'admin',
      },
    });
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/user/cart') return Promise.resolve({ data: { products: [] } });
      if (url === '/user/wishlist') return Promise.resolve({ data: { wishlist: [] } });
      return Promise.resolve({ data: null });
    });

    renderWithProviders(<Navbar />);
    await waitFor(() => {
      // Both desktop nav and mobile sheet show an Admin link
      expect(screen.getAllByRole('link', { name: /^admin$/i }).length).toBeGreaterThan(0);
    });
  });

  it('renders cart with a count when the cart query returns items', async () => {
    useAuthStore.setState({ token: 'fake-token', user: null });
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/user/cart')
        return Promise.resolve({
          data: {
            products: [{ _id: 'ci1' }, { _id: 'ci2' }, { _id: 'ci3' }],
          },
        });
      if (url === '/user/wishlist') return Promise.resolve({ data: { wishlist: [] } });
      return Promise.resolve({ data: null });
    });

    renderWithProviders(<Navbar />);
    await waitFor(() => {
      // Badge shows the count
      expect(screen.getByText('3')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/cart/i)).toBeInTheDocument();
  });
});