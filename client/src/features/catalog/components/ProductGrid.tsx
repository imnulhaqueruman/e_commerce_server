import type { Product } from '@/shared/types';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { Skeleton } from '@/shared/ui/primitives/skeleton';
import { EmptyState } from '@/shared/ui';
import { PackageX } from 'lucide-react';

/**
 * A responsive product grid with loading and empty states.
 */
export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your filters or search for something else.',
  className,
}: {
  products?: Product[];
  loading?: boolean;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  if (loading) {
    return (
      <div
        className={`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 ${className ?? ''}`}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border bg-card"
            aria-hidden="true"
          >
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={<PackageX className="h-5 w-5" />}
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 ${className ?? ''}`}
    >
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
