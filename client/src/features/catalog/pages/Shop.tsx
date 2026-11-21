import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, SlidersHorizontal } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Select } from '@/shared/ui/primitives/select';
import { Sheet } from '@/shared/ui/primitives/sheet';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { FilterPanel } from '@/features/catalog/components/FilterPanel';
import { useProducts, useProductSearch } from '@/features/catalog/api/products';
import { DEFAULT_PER_PAGE } from '@/shared/lib/constants';
import type { ProductFilters } from '@/shared/types';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest first' },
  { value: 'createdAt-asc', label: 'Oldest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'sold-desc', label: 'Best selling' },
];

/**
 * Read the filter set out of the query string.
 */
const filtersFromParams = (params: URLSearchParams): ProductFilters => {
  const filters: ProductFilters = {};

  const query = params.get('q');
  if (query) filters.query = query;

  const category = params.get('category');
  if (category) filters.category = category;

  const sub = params.get('sub');
  if (sub) filters.sub = sub;

  const brand = params.get('brand');
  if (brand) filters.brand = brand;

  const color = params.get('color');
  if (color) filters.color = color;

  const shipping = params.get('shipping');
  if (shipping) filters.shipping = shipping;

  const stars = params.get('stars');
  if (stars) filters.stars = Number(stars);

  const min = params.get('min');
  const max = params.get('max');
  if (min || max) {
    filters.price = [Number(min || 0), Number(max || 0)];
  }

  return filters;
};

/**
 * The catalogue.
 *
 * Filter state lives in the URL so a result set is shareable and the
 * back button behaves. When any filter is active the page uses
 * `POST /api/search/filters` (which composes every filter server-side);
 * otherwise it uses the paginated `POST /api/products` list.
 */
export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters = useMemo(() => filtersFromParams(params), [params]);
  const hasFilters = Object.keys(filters).length > 0;

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt-desc');
  const perPage = DEFAULT_PER_PAGE;

  const searchQuery = useProductSearch(filters);
  const listQuery = useProducts({
    page,
    perPage,
    sort: sort.split('-')[0],
    order: sort.split('-')[1] as 'asc' | 'desc',
  });

  const applyFilters = useCallback(
    (next: ProductFilters) => {
      const nextParams = new URLSearchParams();
      if (next.query) nextParams.set('q', next.query);
      if (next.category) nextParams.set('category', next.category);
      if (next.sub) nextParams.set('sub', next.sub);
      if (next.brand) nextParams.set('brand', next.brand);
      if (next.color) nextParams.set('color', next.color);
      if (next.shipping) nextParams.set('shipping', next.shipping);
      if (next.stars !== undefined) nextParams.set('stars', String(next.stars));
      if (next.price && (next.price[0] > 0 || next.price[1] > 0)) {
        nextParams.set('min', String(next.price[0]));
        nextParams.set('max', String(next.price[1]));
      }
      setParams(nextParams, { replace: true });
      setPage(1);
      setDrawerOpen(false);
    },
    [setParams],
  );

  const resetFilters = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
    setPage(1);
  }, [setParams]);

  const products = hasFilters ? searchQuery.data : listQuery.data?.items;
  const loading = hasFilters ? searchQuery.isLoading : listQuery.isLoading;
  const total = hasFilters ? (searchQuery.data?.length ?? 0) : (listQuery.data?.total ?? 0);
  const totalPages = listQuery.data?.totalPages ?? 1;

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>Shop · Shopper</title>
      </Helmet>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? `${total} ${total === 1 ? 'product' : 'products'} match your filters`
              : `${total} ${total === 1 ? 'product' : 'products'} in the catalogue`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Input
              value={filters.query ?? ''}
              onChange={(e) =>
                applyFilters({ ...filters, query: e.target.value || undefined })
              }
              placeholder="Search products…"
              aria-label="Search products"
              className="w-52"
            />
          </div>

          <Select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Sort products"
            className="w-auto"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Button
            variant="outline"
            onClick={() => setDrawerOpen(true)}
            className="gap-2 lg:hidden"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border bg-card p-5">
            <FilterPanel
              values={filters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>
        </aside>

        <div className="space-y-6">
          <ProductGrid
            products={products}
            loading={loading}
            emptyTitle={hasFilters ? 'No products match your filters' : 'No products yet'}
            emptyDescription={
              hasFilters
                ? 'Try widening the price range or clearing a filter.'
                : 'Products will appear here once they are added to the catalogue.'
            }
          />

          {!hasFilters && totalPages > 1 ? (
            <nav
              className="flex items-center justify-between border-t pt-6"
              aria-label="Pagination"
            >
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </nav>
          ) : null}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </h2>
        </div>
        <div className="mt-6 overflow-y-auto">
          <FilterPanel
            values={filters}
            onApply={applyFilters}
            onReset={resetFilters}
          />
        </div>
      </Sheet>
    </div>
  );
}
