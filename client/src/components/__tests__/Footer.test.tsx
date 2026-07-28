import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Footer } from '../Footer';

describe('<Footer />', () => {
  it('renders the brand line with the current year', () => {
    renderWithProviders(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${year} Shopper`)),
    ).toBeInTheDocument();
  });

  it('exposes nav links to shop, account and cart', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByRole('link', { name: /shop/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute('href', '/user');
    expect(screen.getByRole('link', { name: /cart/i })).toHaveAttribute('href', '/cart');
  });
});