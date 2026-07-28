import { useSearchParams } from 'react-router-dom';
import { useProductSearch } from '@/api/products';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const { data: products, isLoading } = useProductSearch({ query: q });

  return (
    <div className="container space-y-6 py-8">
      <Helmet>
        <title>{q ? `Search: ${q}` : 'Search'} · Shopper</title>
      </Helmet>
      <h1 className="text-3xl font-semibold">
        Results for <span className="text-primary">&ldquo;{q}&rdquo;</span>
      </h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : (products ?? []).length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          No results found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(products ?? []).map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}