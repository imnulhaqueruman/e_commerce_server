import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { useCategory, useCategorySubs } from '@/features/catalog/api/categories';
import type { Product } from '@/shared/types';

/**
 * A category landing page.
 *
 * `GET /api/category/:slug` returns `{ category, products }`; the
 * sub-category chips come from `GET /api/category/subs/:_id`.
 */
export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useCategory(slug);
  const { data: subs = [] } = useCategorySubs(data?.category?._id);

  const products = (data?.products ?? []) as Product[];

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>{data?.category?.name ?? 'Category'} · Shopper</title>
      </Helmet>

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
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
            {data?.category?.name ?? 'Category'}
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {data?.category?.name ?? 'Category'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? 'product' : 'products'} in
          this category
        </p>
      </div>

      {subs.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {subs.map((sub) => (
            <Link
              key={sub._id}
              to={`/sub/${sub.slug}`}
              className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="font-medium">We could not load this category</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been removed. Try browsing the shop instead.
          </p>
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
          emptyTitle="No products in this category yet"
          emptyDescription="Products added to this category will appear here."
        />
      )}
    </div>
  );
}
