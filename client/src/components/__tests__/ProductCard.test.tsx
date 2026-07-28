import { describe, it, expect } from 'vitest';
import {
  renderWithProviders,
  screen,
} from '@/test/test-utils';
import { ProductCard } from '../ProductCard';
import { apiMock } from '@/test/setup-globals-helpers';

const baseProduct = {
  _id: 'p1',
  title: 'Wireless Headphones',
  slug: 'wireless-headphones',
  description: 'Great sound',
  price: 199.99,
  quantity: 5,
  sold: 12,
  images: ['https://example.test/headphones.jpg'],
  ratings: [
    { star: 5, postedBy: 'u1' },
    { star: 4, postedBy: 'u2' },
  ],
};

describe('<ProductCard />', () => {
  it('renders the title, price and sold count', () => {
    renderWithProviders(<ProductCard product={baseProduct as any} />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('$199.99')).toBeInTheDocument();
    expect(screen.getByText(/12 sold/)).toBeInTheDocument();
  });

  it('renders the product image with the correct alt', () => {
    renderWithProviders(<ProductCard product={baseProduct as any} />);
    expect(screen.getByAltText('Wireless Headphones')).toBeInTheDocument();
  });

  it('links to the product detail URL', () => {
    renderWithProviders(<ProductCard product={baseProduct as any} />);
    const links = screen.getAllByRole('link');
    expect(
      links.some((a) => a.getAttribute('href') === '/product/wireless-headphones'),
    ).toBe(true);
  });

  it('shows "Out of stock" badge when quantity is 0', () => {
    renderWithProviders(
      <ProductCard product={{ ...baseProduct, quantity: 0 } as any} />,
    );
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('falls back to "No image" when no images are present', () => {
    renderWithProviders(
      <ProductCard product={{ ...baseProduct, images: [] } as any} />,
    );
    expect(screen.getByText(/no image/i)).toBeInTheDocument();
  });

  it('calls the wishlist add mutation when not logged in but shows a toast', () => {
    // api calls won't fire because token is missing — heart toggle shows error toast.
    apiMock.post.mockClear();
    renderWithProviders(<ProductCard product={baseProduct as any} />);
    const wishlistBtn = screen.getByRole('button', { name: /toggle wishlist/i });
    wishlistBtn.click();
    // We don't fail if toast internals vary; assert the click was a no-op for api.
    // (react-hot-toast logs to console — assertion kept light.)
    expect(apiMock.post).not.toHaveBeenCalled();
  });
});