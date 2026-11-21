import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { apiMock } from '@/test/httpMock';
import Shop from '@/features/catalog/pages/Shop';

/**
 * The shop page keeps its filter state in the URL so a result set is
 * shareable. These tests cover that serialisation — the URL is what the
 * API query is built from, so a bug here silently drops filters.
 */
describe('Shop — filter serialisation', () => {
  it('renders the product grid from the paginated list', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        items: [
          {
            _id: 'p1',
            title: 'Widget',
            slug: 'widget',
            description: 'A widget',
            price: 10,
            category: 'tools',
          },
        ],
        page: 1,
        perPage: 24,
        total: 1,
        totalPages: 1,
      },
    });

    renderWithProviders(<Shop />);

    expect(await screen.findByText('Widget')).toBeInTheDocument();
  });

  it('sends the composed filter body to the search endpoint', async () => {
    apiMock.post.mockResolvedValue({ data: [] });

    renderWithProviders(<Shop />, { route: '/shop?q=phone&brand=Apple' });

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/search/filters', {
        query: 'phone',
        brand: 'Apple',
      });
    });
  });

  it('omits a filter that is not present', async () => {
    apiMock.post.mockResolvedValue({ data: [] });

    renderWithProviders(<Shop />, { route: '/shop?category=abc123' });

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/search/filters', {
        category: 'abc123',
      });
    });
  });

  it('parses a price range from the URL', async () => {
    apiMock.post.mockResolvedValue({ data: [] });

    renderWithProviders(<Shop />, { route: '/shop?min=10&max=500' });

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/search/filters', {
        price: [10, 500],
      });
    });
  });

  it('parses a rating filter from the URL', async () => {
    apiMock.post.mockResolvedValue({ data: [] });

    renderWithProviders(<Shop />, { route: '/shop?stars=4' });

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/search/filters', {
        stars: 4,
      });
    });
  });

  it('uses the paginated list endpoint when no filter is active', async () => {
    apiMock.post.mockResolvedValue({
      data: { items: [], page: 1, perPage: 24, total: 0, totalPages: 1 },
    });

    renderWithProviders(<Shop />);

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/products', {
        page: 1,
        perPage: 24,
        sort: 'createdAt',
        order: 'desc',
      });
    });
  });

  it('shows an empty state when nothing matches', async () => {
    apiMock.post.mockResolvedValue({ data: [] });

    renderWithProviders(<Shop />, { route: '/shop?q=nothing' });

    expect(
      await screen.findByText('No products match your filters'),
    ).toBeInTheDocument();
  });
});
