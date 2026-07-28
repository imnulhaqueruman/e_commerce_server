import { useParams } from 'react-router-dom';
import { useCategory } from '@/api/categories';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useCategory(slug) as {
    data: { category?: { name: string }; products?: any[] } | undefined;
    isLoading: boolean;
  };

  return (
    <div className="container space-y-6 py-8">
      <Helmet>
        <title>{data?.category?.name ?? 'Category'} · Shopper</title>
      </Helmet>
      <h1 className="text-3xl font-semibold">
        {data?.category?.name ?? 'Category'}
      </h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : (data?.products ?? []).length === 0 ? (
        <p className="text-muted-foreground">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(data?.products ?? []).map((p: any) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}