import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { apiMock } from '@/test/httpMock';
import Cart from '@/features/cart/pages/Cart';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { Cart as CartType } from '@/shared/types';

/**
 * The cart page shows the subtotal, the coupon discount and the total.
 *
 * The maths used to be wrong in two ways that this locks down: the
 * discount was read from `cart.couponApplied` (which the API only
 * returns now), and the total had to fall back to the discounted value
 * when the server did not send one.
 */
const cartWith = (overrides: Partial<CartType> = {}): CartType => ({
  products: [
    {
      product: {
        _id: 'p1',
        title: 'Headphones',
        slug: 'headphones',
        description: 'Nice headphones',
        price: 50,
        category: 'audio',
        images: ['https://example.com/headphones.jpg'],
      },
      count: 2,
      color: 'Black',
      price: 50,
    },
  ],
  cartTotal: 100,
  totalAfterDiscount: null,
  couponApplied: null,
  ...overrides,
});

describe('Cart', () => {
  it('renders an empty state when the cart has no items', async () => {
    apiMock.get.mockResolvedValue({ data: cartWith({ products: [] }) });
    useAuthStore.setState({ token: 'token', loading: false });

    renderWithProviders(<Cart />);

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('shows the subtotal for the cart lines', async () => {
    apiMock.get.mockResolvedValue({ data: cartWith() });
    useAuthStore.setState({ token: 'token', loading: false });

    renderWithProviders(<Cart />);

    await screen.findByText('Headphones');
    expect(screen.getAllByText('$100.00').length).toBeGreaterThan(0);
  });

  it('applies the coupon discount to the total', async () => {
    apiMock.get.mockResolvedValue({
      data: cartWith({
        totalAfterDiscount: 90,
        couponApplied: { name: 'SAVE10', discount: 10 },
      }),
    });
    useAuthStore.setState({ token: 'token', loading: false });

    renderWithProviders(<Cart />);

    expect(await screen.findByText('SAVE10')).toBeInTheDocument();
    expect(screen.getByText('−10%')).toBeInTheDocument();
    expect(screen.getByText('$90.00')).toBeInTheDocument();
  });

  it('computes the discounted total when the server does not send one', async () => {
    apiMock.get.mockResolvedValue({
      data: cartWith({
        totalAfterDiscount: null,
        couponApplied: { name: 'SAVE25', discount: 25 },
      }),
    });
    useAuthStore.setState({ token: 'token', loading: false });

    renderWithProviders(<Cart />);

    await screen.findByText('SAVE25');
    // 100 - 25% = 75
    expect(screen.getByText('$75.00')).toBeInTheDocument();
  });

  it('shows the coupon field when no coupon is applied', async () => {
    apiMock.get.mockResolvedValue({ data: cartWith() });
    useAuthStore.setState({ token: 'token', loading: false });

    renderWithProviders(<Cart />);

    expect(await screen.findByLabelText('Have a coupon?')).toBeInTheDocument();
  });

  it('posts the coupon code and reports an invalid coupon', async () => {
    apiMock.get.mockResolvedValue({ data: cartWith() });
    apiMock.post.mockRejectedValue(new Error('Invalid coupon'));
    useAuthStore.setState({ token: 'token', loading: false });

    renderWithProviders(<Cart />);

    const input = await screen.findByPlaceholderText('SUMMER10');
    await userEvent.type(input, 'BADCODE');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/user/cart/coupon', {
        coupon: 'BADCODE',
      });
    });
  });

  it('sends only the id, count and colour when saving the cart', async () => {
    apiMock.get.mockResolvedValue({ data: cartWith() });
    apiMock.post.mockResolvedValue({ data: { ok: true } });
    useAuthStore.setState({ token: 'token', loading: false });

    renderWithProviders(<Cart />);

    await screen.findByText('Headphones');

    // Bump the quantity with the stepper.
    await userEvent.click(screen.getByLabelText('Increase quantity'));

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/user/cart', {
        cart: [{ _id: 'p1', count: 3, color: 'Black' }],
      });
    });
  });
});
