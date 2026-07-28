import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProduct,
  useRelatedProducts,
  useRateProduct,
} from '@/api/products';
import { useSaveCart } from '@/api/cart';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/format';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { data: product, isLoading } = useProduct(slug);
  const { data: related = [] } = useRelatedProducts(product?._id);
  const rate = useRateProduct();
  const saveCart = useSaveCart();
  const [count, setCount] = useState(1);
  const [color, setColor] = useState<string>('');

  if (isLoading) {
    return (
      <div className="container grid gap-8 py-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-16 text-center text-muted-foreground">
        Product not found.
      </div>
    );
  }

  const avgRating =
    product.ratings && product.ratings.length
      ? product.ratings.reduce((s, r) => s + r.star, 0) / product.ratings.length
      : 0;

  const addToCart = async () => {
    if (!token) {
      toast.error('Please log in to add items to cart');
      navigate('/login');
      return;
    }
    if (!color && product.color) {
      toast.error('Please select a color');
      return;
    }
    try {
      await saveCart.mutateAsync([
        { _id: product._id, count, color: color || product.color || '' },
      ]);
      toast.success('Added to cart');
      navigate('/cart');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const submitRating = async (star: number) => {
    if (!token) {
      toast.error('Please log in to rate');
      return;
    }
    try {
      await rate.mutateAsync({ productId: product._id, star });
      toast.success('Rating saved');
    } catch {
      toast.error('Failed to save rating');
    }
  };

  return (
    <div className="container space-y-12 py-8">
      <Helmet>
        <title>{product.title} · Shopper</title>
      </Helmet>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border bg-muted">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">{product.title}</h1>
          <p className="text-2xl font-bold">{formatCurrency(product.price)}</p>
          <div className="flex items-center gap-2">
            <StarRating value={avgRating} readOnly />
            <span className="text-sm text-muted-foreground">
              ({product.ratings?.length ?? 0})
            </span>
          </div>
          <p className="text-muted-foreground">{product.description}</p>
          {product.color && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Color</span>
              <Select value={color} onChange={(e) => setColor(e.target.value)}>
                <option value="">Select color</option>
                <option value={product.color}>{product.color}</option>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <span className="text-sm font-medium">Quantity</span>
            <Select
              value={String(count)}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={addToCart} disabled={saveCart.isPending}>
            Add to cart
          </Button>
          {token && (
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-2 text-sm font-medium">Rate this product</p>
              <StarRating onChange={submitRating} />
            </div>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Related products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <div
                key={p._id}
                className="space-y-2 rounded-md border p-3"
              >
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="aspect-square w-full rounded object-cover"
                  />
                )}
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-sm">{formatCurrency(p.price)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}