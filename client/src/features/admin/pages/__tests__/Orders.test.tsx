import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { apiMock } from '@/test/httpMock';
import Orders from '@/features/admin/pages/Orders';
import { ORDER_STATUSES } from '@/shared/types';

/**
 * The admin order status dropdown must offer exactly the vocabulary the
 * API accepts. Sending anything else returns `400 Invalid orderStatus`,
 * which is what broke the previous admin screen.
 */
describe('Admin Orders', () => {
  const order = {
    _id: '507f1f77bcf86cd799439011',
    products: [
      {
        product: {
          _id: 'p1',
          title: 'Headphones',
          slug: 'headphones',
          description: 'Nice headphones',
          price: 50,
          category: 'audio',
        },
        count: 2,
        color: 'Black',
        price: 50,
      },
    ],
    orderStatus: 'Not Processed',
    orderedBy: 'u1',
    createdAt: '2024-03-15T10:00:00.000Z',
    paymentIntent: { amount: 10000 },
  };

  it('offers exactly the canonical status values', async () => {
    apiMock.get.mockResolvedValue({ data: [order] });

    renderWithProviders(<Orders />);

    const select = await screen.findByLabelText(
      'Status for order #439011',
    );

    const options = Array.from(
      (select as HTMLSelectElement).options,
    ).map((option) => option.value);

    expect(options).toEqual([...ORDER_STATUSES]);
  });

  it('sends the selected status to the admin endpoint', async () => {
    apiMock.get.mockResolvedValue({ data: [order] });
    apiMock.put.mockResolvedValue({ data: order });

    renderWithProviders(<Orders />);

    const select = await screen.findByLabelText(
      'Status for order #439011',
    );

    await userEvent.selectOptions(select, 'Dispatched');

    await waitFor(() => {
      expect(apiMock.put).toHaveBeenCalledWith('/admin/order-status', {
        orderId: '507f1f77bcf86cd799439011',
        orderStatus: 'Dispatched',
      });
    });
  });

  it('renders the order amount from the payment intent in cents', async () => {
    apiMock.get.mockResolvedValue({ data: [order] });

    renderWithProviders(<Orders />);

    // 10000 cents = $100.00
    expect(await screen.findByText('$100.00')).toBeInTheDocument();
  });

  it('disables the refund button for an already-refunded order', async () => {
    apiMock.get.mockResolvedValue({
      data: [{ ...order, orderStatus: 'Refunded' }],
    });

    renderWithProviders(<Orders />);

    const button = await screen.findByRole('button', { name: /refund/i });
    expect(button).toBeDisabled();
  });

  it('asks for confirmation before refunding', async () => {
    apiMock.get.mockResolvedValue({ data: [order] });
    apiMock.post.mockResolvedValue({
      data: { ok: true, refundId: 're_1', refundStatus: 'succeeded' },
    });

    renderWithProviders(<Orders />);

    const button = await screen.findByRole('button', { name: /refund/i });
    await userEvent.click(button);

    expect(await screen.findByText('Refund this order?')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Refund order' }),
    );

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith(
        '/admin/orders/507f1f77bcf86cd799439011/refund',
      );
    });
  });

  it('shows an empty state when there are no orders', async () => {
    apiMock.get.mockResolvedValue({ data: [] });

    renderWithProviders(<Orders />);

    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
  });
});
