import { Link } from 'react-router-dom';
import { Heart, PackageX } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/shared/types';
import { StarRating } from '@/components/StarRating';
import { Badge } from '@/shared/ui/primitives/badge';
import { formatCurrency, averageRating, primaryImage, categoryName } from '@/shared/lib/format';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from '@/features/account/api/account';

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { token } = useAuthStore();
  const { data: wishlist = [] } = useWishlist();
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveFromWishlist();

  const isWished = wishlist.some((p) =>
    typeof p === 'string' ? p === product._id : p?._id === product._id,
  );

  const rating = averageRating(product.ratings);
  const image = primaryImage(product.images);
  const outOfStock = product.quantity === 0;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.error('Please sign in to use the wishlist');
      return;
    }

    try {
      if (isWished) {
        await removeMutation.mutateAsync(product._id);
        toast.success('Removed from wishlist');
      } else {
        await addMutation.mutateAsync(product._id);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Could not update your wishlist');
    }
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/40 hover:shadow-md',
        className,
      )}
    >
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {image ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <PackageX className="h-8 w-8" />
            <span className="text-xs">No image</span>
          </div>
        )}

        {outOfStock ? (
          <Badge variant="destructive" className="absolute left-2 top-2">
            Out of stock
          </Badge>
        ) : null}

        {product.brand ? (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 bg-background/90 backdrop-blur"
          >
            {product.brand}
          </Badge>
        ) : null}
      </Link>

      <button
        type="button"
        onClick={toggleWishlist}
        aria-label={
          isWished ? 'Remove from wishlist' : 'Add to wishlist'
        }
        aria-pressed={isWished}
        className="absolute right-2 top-2 rounded-full bg-background/85 p-2 shadow-sm backdrop-blur transition-colors hover:bg-background"
      >
        <Heart
          size={15}
          className={cn(
            'transition-colors',
            isWished ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
          )}
        />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/product/${product.slug}`}
            className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
          >
            {product.title}
          </Link>
          <span className="shrink-0 text-sm font-semibold">
            {formatCurrency(product.price)}
          </span>
        </div>

        {categoryName(product.category) ? (
          <p className="text-xs text-muted-foreground">
            {categoryName(product.category)}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <StarRating value={rating} readOnly size="sm" />
          <span>{product.sold ?? 0} sold</span>
        </div>
      </div>
    </article>
  );
}
