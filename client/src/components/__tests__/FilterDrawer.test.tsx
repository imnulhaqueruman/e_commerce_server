import { describe, it, expect, vi } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
} from '@/test/test-utils';
import { FilterDrawer, type ProductFilterValues } from '../FilterDrawer';
import { apiMock } from '@/test/setup-globals-helpers';

const categories = [
  { _id: 'c1', name: 'Audio', slug: 'audio' },
  { _id: 'c2', name: 'Laptops', slug: 'laptops' },
];

describe('<FilterDrawer />', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    values: {} as ProductFilterValues,
    onApply: vi.fn(),
  };

  it('renders the Filters heading when open', () => {
    renderWithProviders(<FilterDrawer {...baseProps} />);
    expect(screen.getByRole('heading', { name: /filters/i })).toBeInTheDocument();
  });

  it('does not render anything when open is false', () => {
    renderWithProviders(<FilterDrawer {...baseProps} open={false} />);
    expect(screen.queryByRole('heading', { name: /filters/i })).not.toBeInTheDocument();
  });

  it('populates category options from useCategories()', async () => {
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/categories') return Promise.resolve({ data: categories });
      return Promise.resolve({ data: [] });
    });
    renderWithProviders(<FilterDrawer {...baseProps} />);
    expect(await screen.findByRole('option', { name: 'Audio' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Laptops' })).toBeInTheDocument();
  });

  it('calls onApply with current values and closes when Apply is clicked', async () => {
    const onApply = vi.fn();
    const onOpenChange = vi.fn();
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/categories') return Promise.resolve({ data: categories });
      return Promise.resolve({ data: [] });
    });

    const user = userEvent.setup();
    renderWithProviders(
      <FilterDrawer
        open
        onOpenChange={onOpenChange}
        values={{ query: 'phone' }}
        onApply={onApply}
      />,
    );

    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ query: 'phone' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clears filters and closes when Reset is clicked', async () => {
    const onApply = vi.fn();
    const onOpenChange = vi.fn();
    apiMock.get.mockImplementation(() => Promise.resolve({ data: categories }));
    const user = userEvent.setup();
    renderWithProviders(
      <FilterDrawer
        open
        onOpenChange={onOpenChange}
        values={{ query: 'x' }}
        onApply={onApply}
      />,
    );
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(onApply).toHaveBeenCalledWith({});
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});