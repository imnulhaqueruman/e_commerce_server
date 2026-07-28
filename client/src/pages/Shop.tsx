import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FilterDrawer,
  type ProductFilterValues,
} from '@/components/FilterDrawer';
import { useProductSearch } from '@/api/products';
import { Helmet } from 'react-helmet-async';

export default function Shop() {
  const [filters, setFilters] = useState<ProductFilterValues>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: products, isLoading } = useProductSearch({
    query: filters.query,
    price: filters.price,
    category: filters.category,
    sub: filters.sub,
    color: filters.color,
    brand: filters.brand,
    stars: filters.rating,
    shipping: filters.shipping,
  });

  return (
    <div className="container space-y-6 py-8">
      <Helmet>
        <title>Shop · Shopper</title>
      </Helmet>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Shop</h1>
        <Button
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : (products ?? []).length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          No products match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(products ?? []).map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        values={filters}
        onApply={setFilters}
      />
    </div>
  );
}