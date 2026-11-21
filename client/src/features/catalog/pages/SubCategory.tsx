import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { useSub } from '@/features/catalog/api/categories';
import type { Product } from '@/shared/types';

/**
 * A sub-category landing page.
 *
 * `GET /api/sub/:slug` returns `{ sub, products }`.
 */
export default function SubCategory() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useSub(slug);

  const products = (data?.products ?? []) as Product[];

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>{data?.sub?.name ?? 'Sub category'} · Shopper</title>
      </Helmet>

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link to="/shop" className="hover:text-foreground">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="text-foreground">
            {data?.sub?.name ?? 'Sub category'}
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {data?.sub?.name ?? 'Sub category'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      {isError ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="font-medium">We could not load this sub category</p>
          <Link
            to="/shop"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <ProductGrid
          products={products}
          loading={isLoading}
          emptyTitle="No products in this sub category yet"
        />
      )}
    </div>
  );
}
