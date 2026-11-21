import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { useProductSearch } from '@/features/catalog/api/products';

/**
 * Search results.
 *
 * Reads `q` from the query string and runs it through the composed
 * filter endpoint, so a search term combines with any other active filter.
 */
export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  const { data: products, isLoading } = useProductSearch({ query: q });

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>{q ? `Search: ${q}` : 'Search'} · Shopper</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {q ? (
            <>
              Results for <span className="text-primary">&ldquo;{q}&rdquo;</span>
            </>
          ) : (
            'Search'
          )}
        </h1>
        {!isLoading && q ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {products?.length ?? 0} {products?.length === 1 ? 'match' : 'matches'}
          </p>
        ) : null}
      </div>

      {!q ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <SearchIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">What are you looking for?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the search box in the header to look through the catalogue.
          </p>
        </div>
      ) : (
        <ProductGrid
          products={products}
          loading={isLoading}
          emptyTitle="No results found"
          emptyDescription="Try a different keyword or browse the full catalogue."
        />
      )}
    </div>
  );
}
