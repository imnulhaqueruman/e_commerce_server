import { useParams } from 'react-router-dom';
import { useSub } from '@/api/subs';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';

export default function SubCategory() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useSub(slug);

  return (
    <div className="container space-y-6 py-8">
      <Helmet>
        <title>{data?.sub?.name ?? 'Sub'} · Shopper</title>
      </Helmet>
      <h1 className="text-3xl font-semibold">{data?.sub?.name ?? 'Sub'}</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : (data?.products ?? []).length === 0 ? (
        <p className="text-muted-foreground">No products in this sub-category yet.</p>
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