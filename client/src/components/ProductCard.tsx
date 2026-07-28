import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAddToWishlist, useRemoveFromWishlist, useWishlist } from '@/api/user';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

interface Props {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: Props) {
  const { token } = useAuthStore();
  const { data: wishlist = [] } = useWishlist();
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveFromWishlist();

  const isWished = Boolean(
    wishlist.find?.((p: any) =>
      typeof p === 'string' ? p === product._id : p?._id === product._id
    )
  );

  const avgRating =
    product.ratings && product.ratings.length > 0
      ? product.ratings.reduce((s, r) => s + r.star, 0) / product.ratings.length
      : 0;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please log in to use the wishlist');
      return;
    }
    if (isWished) {
      removeMutation.mutate(product._id, {
        onSuccess: () => toast.success('Removed from wishlist'),
        onError: () => toast.error('Failed to update wishlist'),
      });
    } else {
      addMutation.mutate(product._id, {
        onSuccess: () => toast.success('Added to wishlist'),
        onError: () => toast.error('Failed to update wishlist'),
      });
    }
  };

  return (
    <Card className={cn('group relative overflow-hidden', className)}>
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          {product.quantity === 0 && (
            <Badge variant="destructive" className="absolute left-2 top-2">
              Out of stock
            </Badge>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={toggleWishlist}
        aria-label="Toggle wishlist"
        className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 shadow-sm transition-colors hover:bg-background"
      >
        <Heart
          size={16}
          className={cn(
            isWished
              ? 'fill-red-500 text-red-500'
              : 'text-muted-foreground'
          )}
        />
      </button>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/product/${product.slug}`}
            className="line-clamp-1 text-sm font-medium hover:underline"
          >
            {product.title}
          </Link>
          <span className="text-sm font-semibold">
            {formatCurrency(product.price)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <StarRating value={avgRating} readOnly size="sm" />
          <span>{product.sold ?? 0} sold</span>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full"
        >
          <Link to={`/product/${product.slug}`}>
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            View
          </Link>
        </Button>
      </div>
    </Card>
  );
}