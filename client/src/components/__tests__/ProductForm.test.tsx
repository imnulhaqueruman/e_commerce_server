import { describe, it, expect, vi } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from '@/test/test-utils';
import ProductForm from '../ProductForm';
import { apiMock } from '@/test/setup-globals-helpers';

describe('<ProductForm />', () => {
  it('renders all base fields', () => {
    renderWithProviders(<ProductForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save product/i })).toBeInTheDocument();
  });

  it('shows validation errors when required fields are missing', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ProductForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /save product/i }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
    // Title and description both have min-length validators.
    const titleErr = await screen.findByText(/title is required/i);
    expect(titleErr).toBeInTheDocument();
  });

  it('submits with form values when all fields are valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ProductForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Cool Shoes');
    await user.type(
      screen.getByLabelText(/description/i),
      'A very comfortable pair of shoes for everyday use.',
    );
    await user.type(screen.getByLabelText(/price/i), '79.5');
    await user.clear(screen.getByLabelText(/quantity/i));
    await user.type(screen.getByLabelText(/quantity/i), '10');

    await user.click(screen.getByRole('button', { name: /save product/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.title).toBe('Cool Shoes');
    expect(payload.price).toBe('79.5');
    expect(payload.images).toEqual([]);
  });

  it('disables the submit button when submitting=true and changes its label', () => {
    renderWithProviders(<ProductForm onSubmit={vi.fn()} submitting />);
    const btn = screen.getByRole('button', { name: /saving…/i });
    expect(btn).toBeDisabled();
  });
});